## Insurance Wellness Hub

- **Project Name**: Insurance Wellness Hub
- **Architecture**: Monorepo using NX workspace

- **About**:
  IIRM Holdings invests in various group companies involved in insurance distribution, wellness services, and insurance staffing and skill development services

### Frontend

- ReactJS with Vite
- Material UI (MUI) components
- TypeScript
- Jest for testing

### Backend

- NestJS microservices
- PostgreSQL database
- TypeORM for database management
- Swagger for API documentation

### Infrastructure

- Docker containerization
- Kubernetes orchestration
- AWS cloud hosting
- CI/CD pipeline

### Localization

The frontend recognizes two number formats which should be provided by the localization service:

| Key             | Pattern       | Example           |
| --------------- | ------------- | ----------------- |
| `indian`        | `#,##,###.##` | `12,34,56,789.00` |
| `international` | `#,###.##`    | `123,456,789.00`  |

Use these keys or patterns when sending localization data from the backend.

### Code Setup on Local Machine

- nvm version 0.39
- node version - v22.14.0
- react version - v18.3.1
- Nx version - v20.5.0
- PgAdmin - 4

#### nx Installation

```
npm i -g nx
```

#### Repository

[New Wellnesss Hub Repository URL ](https://github.com/divamidesignlabs/new-insurance-wellness-hub)

### How to run applications

#### Frontend

```
// nx run @insurance-wellness-hub/[MFE-Name]:serve --configuration=[buildEnv]

nx run @insurance-wellness-hub/iwork:serve --configuration=development
```

#### Backend

```
// NODE_ENV=dev nx serve [servicename]

NODE_ENV=dev nx serve service-registry
NODE_ENV=dev nx serve api-gateway
NODE_ENV=dev nx serve org-service
NODE_ENV=dev nx serve auth-service
NODE_ENV=dev nx serve opportunity-service
NODE_ENV=dev nx serve policy-service
NODE_ENV=dev nx serve notification-service
NODE_ENV=dev nx serve scheduler-service
NODE_ENV=dev nx serve ai-service
NODE_ENV=dev nx serve knowledge-service
```

### How to build applications

To build applications

#### Backend

```
// NODE_ENV=dev nx build [servicename]

NODE_ENV=dev nx build service-registry
NODE_ENV=dev nx build api-gateway
NODE_ENV=dev nx build org-service
NODE_ENV=dev nx build auth-service
NODE_ENV=dev nx build opportunity-service
NODE_ENV=dev nx build policy-service
NODE_ENV=dev nx build notification-service
NODE_ENV=dev nx build scheduler-service
NODE_ENV=dev nx build ai-service
NODE_ENV=dev nx build knowledge-service
```

#### Frontend

```
// nx run @insurance-wellness-hub/[MFE-Name]:build --configuration=[buildEnv]

nx run @insurance-wellness-hub/iwork:build --configuration=development
```

### How to generate test reports

#### Backend

To generate test reports , run the test suites

```
// without Coverage Reports
nx test [Service-Name]
nx test org-service

// With Coverage Reports
nx test [Service-Name] --coverage
nx test org-service --coverage
nx test opportunity-service --coverage
nx test auth-service --coverage
```

#### Frontend

To generate test reports , run the test suites

```
// Without Coverage Reports
nx test [MFE-Name]
nx test iwork

// With Coverage Reports
nx test [MFE-Name] --coverage
nx test iwork --coverage
```

we can access the report from test-output folder in particular MFE folder

```
iwork/test-output/index.html

```

### How access swagger documentation

To access swagger documentation

- Run the required service
- Browse below url

```
 http://localhost:[serviceport]/api/docs

 https://localhost:2023/api/docs
```

### Where to find Documentation

- Service respective Documentation will be available at root folder of the respective service
  - Ex: apps/services/auth-service/README-Auth.md
- Feature flag documentation for the UI resides in `apps/ui/FEATURE_FLAGS.md`

#### Project Folder Structure

```
insurance-wellness-hub/
│── apps/
│   ├── ui/        (React web Apps)
│   │   ├── container/
│   │   ├── iwork/
│   │   ├── ibp/
│   │   ├── admin/
│   │   ├── ui-lib/
│   ├── mobile/       (React Native mobile Apps)
│   │   ├── container/
│   │   ├── ibp/
│   │   ├── mobile-lib/
│   ├── services/       (NestJS Backend Apps)
│   │   ├── api-gateway/
│   │   ├── service-registry/
│   │   ├── config-service/
│   │   ├── org-service/
│   │   ├── opportunity-service/
│   │   ├── policy-service/
│   │   ├── template-service/
│   │   ├── document-service/
│   │   ├── report-service/
│   │   ├── etl-service/
│   │   ├── notification-service/
│   │   ├── scheduler-service/
│   │   ├── search-service/
│   │   ├── connector-service/
│   │   ├── auth-service/
│   │   ├── common-service/
│   │   ├── services-lib/
├── libs/               (Shared Libraries)
│   ├── common-lib/
│   ├── ui-data-lib/
│   ├── utils-lib/
├── nx.json
├── package.json
├── tsconfig.base.json
├── workspace.json

```
