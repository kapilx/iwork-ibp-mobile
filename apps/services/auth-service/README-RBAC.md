## RBAC Implementation

### Introduction
- RBAC Design 
- RBAC Implementation 
    - Auth Gaurd & ACL Guard 
- Architecture Diagram 
- Database Schema 
- API Endpoints 
- Testing and Validation 
- Security Considerations 
- Limitations 

### RBAC Design 
- Once the user logged in , our system will issue **JWT token** , Which will be maintained for all other requests

- If the request is without token in request headers , will be restricted by **Auth Gaurd**

- Once the request is with token in header 
    - Decode the Token
    - Identify the User and his Roles 
        - If Authorized proceed to ACL Guard 
        - Else return message **Un Authorized User**

- Valid user Token and passed the Auth Guard 
    - **ACL Gaurd** will checks for the access to the requested resource based on the user role
        - If valid Allow the user for accessing the resource 
        - Else return message **Access Denied**

### Architecture & Flow 

```mermaid
flowchart LR
A["Logged in User"] -- 1 --> B["API-Gateway"]
B -- 3 --> E["Service Registry"]
E --> B
B -- 4 --> F["Micro-Service"]
F --> G@{ shape: cyl, label: "Database" }
B -- 2 --> C@{ shape: diamond, label: "RBAC validation" }
C --  Authorised <br> user --> D1@{ shape: diamond, label: "ACL Check" }
C  -- Un Authorised <br> user --> D@{ shape: circle, label: stop/Exit}
D1 -- Authorised <br> user --> B
D1 -- No Access <br> to user --> D

```

### RBAC Implementation 

### API Endpoints 
- AuthGuard and RoleGuard Applied for all the routes except login and userdetails. These 2 enpoints will be ignored
    - /login
    - /user-details

```
async canActivate(context: ExecutionContext): Promise<boolean> {
if(path === '/login' || path === '/user-details') {
      return true;
    }
}
```
### Guards

**Auth Guard**

**ACL Gaurd**


**Apply AuthGaurd and ROleGaurd at endpoints**
```
 @All(":service/*")
  @UseGuards(AuthGuard, AclGuard)
  async proxyRequest(
    @Param("service") serviceName: string,
    @Req() request: Request
  ) {
  
        statements;
  
    }
```


### Database Shema 
- users  : Stores the user details 
- roles  : Stores all the roles 
- user_role : Stores the mapping of the role to the user 
- acl-category : Stores entity  category like Company , Opportunity, Approval
- acl_action : Stores action list like READ, WRITE , DELETE
- acl_category_action_map : Stores the mapping of category and actions , Like Company - READ
- role_acl_category_action_map : Stores the mapping of role and category_action


```mermaid 
erDiagram
    users {
        INTEGER id PK
        VARCHAR first_name
        VARCHAR last_name
        VARCHAR email_id
        VARCHAR mobile
        VARCHAR login_name
        VARCHAR password
        INTEGER branch_id
        INTEGER department_id
        INTEGER designation_id
        INTEGER reporting_user_id
        INTEGER salutation_lid
        TIMESTAMP deleted_at
        VARCHAR iirm_emp_id
    }

    user_role {
        INTEGER id PK
        INTEGER user_id FK
        INTEGER role_id FK
        TIMESTAMP created_at
        TIMESTAMP updated_at
        VARCHAR created_by
        VARCHAR updated_by
    }

    roles {
        INTEGER id PK
        VARCHAR name
        TEXT description
        TIMESTAMP created_at
        TIMESTAMP updated_at
        VARCHAR created_by
        VARCHAR updated_by
    }

    role_acl_category_action_map {
        INTEGER id PK
        INTEGER role_id FK
        INTEGER acl_category_action_id FK
        TIMESTAMP created_at
        TIMESTAMP updated_at
        VARCHAR created_by
        VARCHAR updated_by
    }

    acl_category_action_map {
        INTEGER id PK
        INTEGER acl_category_id FK
        INTEGER acl_action_id FK
        TIMESTAMP created_at
        TIMESTAMP updated_at
        VARCHAR created_by
        VARCHAR updated_by
    }

    acl_categories {
        INTEGER id PK
        VARCHAR name
        TEXT description
        TIMESTAMP created_at
        TIMESTAMP updated_at
        VARCHAR created_by
        VARCHAR updated_by
        VARCHAR parent
        VARCHAR category_key
        VARCHAR application_scope
    }

    acl_actions {
        INTEGER id PK
        VARCHAR name
        TEXT description
        TIMESTAMP created_at
        TIMESTAMP updated_at
        VARCHAR created_by
        VARCHAR updated_by
        VARCHAR action_key
    }

    users ||--o{ user_role : has
    roles ||--o{ user_role : assigns
    roles ||--o{ role_acl_category_action_map : grants
    acl_category_action_map ||--o{ role_acl_category_action_map : includes
    acl_categories ||--o{ acl_category_action_map : categorizes
    acl_actions ||--o{ acl_category_action_map : performs

```

### RBAC Object for UI 

- **Endpoint** : access-control-list/permissions
- **Service** : Auth-Service

RBAC Response Object 
```
{
        "roleId": 5,
        "roleName": "BD",
        "access": {
            "iWork": {
                "TPA": {
                    "CMP_TPA_001": {
                        "READ_001": true,
                        "WRITE_001": true,
                        "UPDATE_001": true,
                        "IMPORT_001": true,
                        "EXPORT_001": true,
                        "DELETE_001": true
                    },
                    "OPTY_TPA_001": {
                        "READ_001": true,
                        "WRITE_001": true,
                        "UPDATE_001": true,
                        "IMPORT_001": true,
                        "EXPORT_001": true,
                        "DELETE_001": true
                    }
                },
                "BD": {
                    "RD_BD_001": {
                        "READ_001": true,
                        "WRITE_001": true,
                        "UPDATE_001": true,
                        "IMPORT_001": true,
                        "EXPORT_001": true,
                        "DELETE_001": true
                    }
                }
            }
        }
    }
```

### Target Systems/Modules affected


### Limitations
- When the request is though API-Gateway, ACL and Auth gaurds will strictly restrict the un-authorized access

- When the request is directly accessing service Endpoint, Need to apply one more level of securing process . How ever these endpoint will not exposed to outside as the services are running in ELK cluster 

### Feature Enhancements




