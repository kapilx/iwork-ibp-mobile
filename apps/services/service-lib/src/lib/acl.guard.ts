import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { AclService } from "./acl.service";
import {
  bypassAclGuardApis,
  EXPORT_MODULE_KEYS,
  iirm,
  subPaths,
  opportunityActivityWriteSegments,
  OPPORTUNITY_ACTIVITY_SUBPATH,
} from "./constants";

@Injectable()
export class AclGuard implements CanActivate {
  constructor(
    private readonly aclService: AclService
  ) { }

  getSubPath(path: string): string {
    const subpathArray = path.split("/").filter(Boolean);
    let subpath = subpathArray[0];
    if (subpathArray.length > 1) {
      if (subPaths.includes(subpathArray[1])) { subpath = `${subpath}/${subpathArray[1]}`; }
      else if (subpathArray.length > 2 && !isNaN(parseInt(subpathArray[1])) && subpathArray[2].includes('download') && subpathArray[2].includes('moduleKey')) {
        subpath = EXPORT_MODULE_KEYS[String(subpathArray[2].split("moduleKey=")[1])] ? `${EXPORT_MODULE_KEYS[String(subpathArray[2].split("moduleKey=")[1])]}` : subpath;
      } else if ((['policies', 'hospitals'].every(key => subpathArray.includes(key))) && subpathArray[4].includes('export')) {
        subpath = EXPORT_MODULE_KEYS[subpath] ? `${EXPORT_MODULE_KEYS[subpath]}` : subpath
      } else if (subpathArray.length > 4 && (['caution-deposit', 'transactions?export=true'].every(key => subpathArray.includes(key)))) {
        subpath = EXPORT_MODULE_KEYS['caution_deposit'] ? `${EXPORT_MODULE_KEYS['caution_deposit']}` : subpath
      } else if (subpathArray[1].includes('excel-generation-url')) {
        // Opportunity excel download is an export, not an opty write. Route it to
        // the dedicated export subPath so it is authorized by OPTY/EXPORT_001
        // instead of inheriting the generic "opportunity" POST (OPTY write).
        subpath = EXPORT_MODULE_KEYS['opportunity'] ? `${EXPORT_MODULE_KEYS['opportunity']}` : subpath
      } else if (subpathArray[1].includes('so-report-excel') || subpathArray[1].includes('ro-report-excel')) {
        // Async SO/RO listing export (GET /opportunity/so-report-excel/export,
        // /opportunity/ro-report-excel/export, .../export/:jobId) — same
        // export permission as the broking-slip excel-generation-url above,
        // not the generic "opportunity" GET/view.
        subpath = EXPORT_MODULE_KEYS['opportunity'] ? `${EXPORT_MODULE_KEYS['opportunity']}` : subpath
      } else if (subpathArray[1].includes('policy-report-excel') || subpathArray[1].includes('policies-report-excel') || subpathArray[1].includes('bizdone-report-excel')) {
        // policy-report-excel = BizDone's synchronous business-performance
        // download; bizdone-report-excel = its async export/exports/status
        // counterpart; policies-report-excel = plain /policy/policies
        // listing export. Distinct routes/reportTypes, same export
        // permission bucket.
        subpath = EXPORT_MODULE_KEYS['policy_report_excel'] ? `${EXPORT_MODULE_KEYS['policy_report_excel']}` : subpath
      } else if (subpath == 'report' && subpathArray[1].includes('download')) {
        subpath = EXPORT_MODULE_KEYS['report'] ? `${EXPORT_MODULE_KEYS['report']}` : subpath
      } else if (subpathArray.length > 2 && !isNaN(parseInt(subpathArray[1])) && subpathArray[2].includes('employee-insured-excel')) {
        subpath = EXPORT_MODULE_KEYS['employee_insured_excel'] ? `${EXPORT_MODULE_KEYS['employee_insured_excel']}` : subpath
      }
    }
    if(subpathArray.length == 1 && subpath.includes('?')){
      subpath = subpath.split('?')[0]
    }
    return subpath;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // By passing the login and register endpoints
    const serviceName = request.params.service;
    const path = request.url ? request.url.replace(`/${iirm}/${serviceName}`, "") : request.path.replace(`/${iirm}/${serviceName}`, "");
    const subPath = this.getSubPath(path);

    if (
      bypassAclGuardApis.includes(path) ||
      path.includes("employee/password-reset-mail") ||
      path.includes("employee/password-reset") ||
      path.includes("employee/company-employee-password-reset-mail") ||
      path.includes("employee/hierarchy") ||
      path.includes("employee/my-profile") ||
      path.includes("look-up") ||
      path.includes("claim") ||
      path.includes("service-tat") ||
      path.includes("document") ||
      path.includes("activity-approval") ||
      path.includes("business-card") ||
      path.includes("research/company") ||
      path.includes("pdf-analyser") ||
      path.includes("refresh-token") ||
      path.includes("non-group-claim") ||
      path.includes("logout") ||
      path.includes("ibp-password-reset") ||
      path.includes("ibp-password-reset-mail") ||
      path.includes("company-employee/login") ||
      // path.includes("company-employee-details") ||
      path.includes("/tickets") ||
      path.includes("/nl2sql") ||
      path.includes('/get-nudge-data') ||
      path.includes("/nudge-data") ||
      path.includes("/nl-2-sql/conversation")||
      path.includes("/nl-2-sql/response") ||
      path.includes("/nudge-data/get-nudge-parameter-data") ||
      path.includes("prompt/favourites") ||
      path.includes("prompt/add-favourite") ||
      path.includes("prompt/remove-favourite") ||
      path.includes("user-feedback") ||
      path.includes('/paginate') ||
      path.includes("/config/company") ||
      path.includes("/auth/google/login") ||
      path.includes("/auth-config/company") ||
      (path.includes("/auth-config/file-upload/") &&
        path.includes("/download")) ||
      path.includes("/auth/phone-otp/verify") ||
      path.includes("/auth/email-otp") ||
      path.includes("/oauth/callback") ||
      path.includes("/google/auth-url") ||
      path.includes("/google/callback") ||
      path.includes("/auth/microsoft/auth-url") ||
      path.includes("/auth/microsoft/callback") ||
      path.includes("auth/phone-otp") ||
      path.includes("external-app-sso/magic-url") ||
      path.includes("entity-fields") ||
      path.includes("notifications/info") ||
      path.includes("mapping-templates") ||
      path.includes("onboarding") ||
      path.includes("hr-module") ||
      path.includes("/crm-redirect-token") ||
      path.includes("/password-protection-config") ||
      path.includes("/tpa-external-feature") ||
      path.includes("/tpa-sso-config") ||
      // All of integrations/hcl/* (inbound push + the RiskWatch-facing
      // intake/list/mark-processing routes on the same controller) —
      // previously covered for free by the generic "hr-module" bypass above
      // when this lived at hr-module/hcl/*. Moved to
      // external-integration-service as integrations/hcl/*, which is no
      // longer under hr-module, so it needs its own explicit entry to avoid
      // a regression: the inbound route has no JWT/request.user at all (see
      // auth.guard.ts's matching bypass) and must skip the ACL check below
      // regardless; the admin-facing routes inherit the same pre-existing
      // no-ACL-mapping gap the old hr-module bypass already had for them
      // (e.g. Zoho's hr-module/zoho/* routes still have this gap today) —
      // not a new hole introduced by this move, just carried forward as-is.
      path.includes("/integrations/hcl") ||
      (path.includes("file-password-config") &&
        request.method === "GET")
    ) {
      return true;
    }
    if (subPath === "knowledge" || subPath === "localization" || subPath === "notifications") return true; // TODO: remove this line when ACL is mapped in DB for knowledge service

    const user = request.user;

    // CRM (iWork) users are authenticated by the JWT signature (AuthGuard).
    // Their tokens carry no ACL role IDs — bypass the role check for them.
    if (user?.roleKey === "PORTAL_CRM") {
      return true;
    }

    // return unauthorized if roleId is not present
    if (!user || !user?.userDetails?.roles) {
      throw new UnauthorizedException("Missing user role");
    }

    const method = request.method;
    const roleIds = user?.userDetails?.roles.map((role: any) => role.id);
    console.log("roleIdsroleIdsroleIds", roleIds);

    // Opportunity activity-write routes (e.g. PUT /opportunity/activity, broking
    // slip, quote) share the bare "opportunity" subPath with opty create/edit,
    // so they would otherwise require OPTY write/update. Redirect the write
    // methods to a dedicated subPath authorized by OPTY_ACTIVITY, leaving opty
    // CRUD on "opportunity". GET (view) routes are excluded by the method gate.
    let effectiveSubPath = subPath;
    if (
      subPath === "opportunity" &&
      ["POST", "PUT", "DELETE"].includes(method)
    ) {
      const segment = path.split("/").filter(Boolean)[1]?.split("?")[0];
      if (segment && opportunityActivityWriteSegments.includes(segment)) {
        effectiveSubPath = OPPORTUNITY_ACTIVITY_SUBPATH;
      }
    }

    const hasAccess = await this.aclService.hasAccess(
      roleIds,
      method,
      effectiveSubPath
    );
    console.log("hasAccesshasAccesshasAccess", hasAccess);
    if (!hasAccess) {
      throw new UnauthorizedException("Access denied");
    }

    return true;
  }
}
