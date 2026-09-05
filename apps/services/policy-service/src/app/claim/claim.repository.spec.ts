import { Test } from "@nestjs/testing";
import { TypeOrmModule, getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  FileUpload,
  PolicyClaim,
  PolicyClaimSettlement,
  PolicyEnrollmentEmployeePolicyMap,
  PolicyEnrollmentDependent,
  Policy,
  PolicyEnrollmentEmployee,
} from "../../../../service-lib/src/lib/entities";
import { ClaimRepository } from "./claim.repository";

describe("ClaimRepository", () => {
  let repo: ClaimRepository;
  let fileRepo: Repository<FileUpload>;
  let employeeRepo: Repository<PolicyEnrollmentEmployee>;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: "sqlite",
          database: ":memory:",
          dropSchema: true,
          entities: [
            FileUpload,
            PolicyClaim,
            PolicyClaimSettlement,
            PolicyEnrollmentEmployeePolicyMap,
            PolicyEnrollmentDependent,
            Policy,
            PolicyEnrollmentEmployee,
          ],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([
          FileUpload,
          PolicyClaim,
          PolicyClaimSettlement,
          PolicyEnrollmentEmployeePolicyMap,
          PolicyEnrollmentDependent,
          Policy,
          PolicyEnrollmentEmployee,
        ]),
      ],
      providers: [ClaimRepository],
    }).compile();

    repo = module.get(ClaimRepository);
    fileRepo = module.get(getRepositoryToken(FileUpload));
    employeeRepo = module.get(getRepositoryToken(PolicyEnrollmentEmployee));
  });

  it("should save and retrieve claim with settlement", async () => {
    const file = await fileRepo.save({
      fileKey: "k",
      uploadType: "t",
      createdBy: 1,
      updatedBy: 1,
      companyType: "c",
      documentTypeLid: 1,
      companyId: 1,
    });
    const employee = await employeeRepo.save({
      employeeCompanyId: "c1",
      employeeName: "Emp",
      createdBy: 1,
      updatedBy: 1,
    });
    const claim = await repo.saveClaim({
      policyId: 1,
      employeeId: employee.id,
      employeeTpaId: "T1",
      sourceFileUploadId: file.id,
    });
    await repo.saveSettlement({
      claimId: claim.id,
      sourceFileUploadId: file.id,
      settlementAmount: 100,
    });
    const [found, count] = await repo.findClaimsByPolicyId(1, 1, 10);
    expect(count).toBe(1);
    expect(found[0].settlements[0].settlementAmount).toBe(100);
  });

  it("should group by claim date when filtering by TAT", async () => {
    const countClone = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
    };
    const qb: any = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      having: jest.fn().mockReturnThis(),
      clone: jest.fn().mockReturnValue(countClone),
      getRawAndEntities: jest.fn().mockResolvedValue({ raw: [], entities: [] }),
    };
    const spy = jest
      .spyOn((repo as any).claimRepo, "createQueryBuilder")
      .mockReturnValue(qb);

    await repo.findAllClaims(1, 10, [1], [], undefined, 0, 7);

    expect(qb.groupBy).toHaveBeenCalledWith("claim.id");
    expect(qb.addGroupBy).toHaveBeenCalledWith("claim.claimDate");
    expect(countClone.getRawMany).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("falls back to claim.createdAt DESC when no sort is requested", async () => {
    const countClone = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
    };
    const qb: any = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      having: jest.fn().mockReturnThis(),
      clone: jest.fn().mockReturnValue(countClone),
      getRawAndEntities: jest.fn().mockResolvedValue({ raw: [], entities: [] }),
    };
    const spy = jest
      .spyOn((repo as any).claimRepo, "createQueryBuilder")
      .mockReturnValue(qb);

    await repo.findAllClaims(1, 10, [1], [], undefined, undefined, undefined, undefined, undefined, false, undefined, undefined);

    expect(qb.orderBy).toHaveBeenCalledWith("claim.createdAt", "DESC");
    expect(qb.addOrderBy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("applies a multi-column sort string as primary orderBy + addOrderBy tie-breakers, in request order", async () => {
    const countClone = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
    };
    const qb: any = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      having: jest.fn().mockReturnThis(),
      clone: jest.fn().mockReturnValue(countClone),
      getRawAndEntities: jest.fn().mockResolvedValue({ raw: [], entities: [] }),
    };
    const spy = jest
      .spyOn((repo as any).claimRepo, "createQueryBuilder")
      .mockReturnValue(qb);

    await repo.findAllClaims(
      1,
      10,
      [1],
      [],
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      false,
      undefined,
      "claimDate:DESC,claimAmount:ASC",
    );

    expect(qb.orderBy).toHaveBeenCalledWith("claim.claimDate", "DESC");
    expect(qb.addOrderBy).toHaveBeenCalledWith("claim.claimAmount", "ASC");
    // unmapped/unknown sort keys must never reach the query
    expect(qb.orderBy).not.toHaveBeenCalledWith("claim.createdAt", "DESC");
    spy.mockRestore();
  });
});
