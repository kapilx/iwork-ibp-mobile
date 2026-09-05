# ACL API Testing - Complete Implementation Guide

## Project: Access Control List API Unit Testing
**Estimated Total Time: 10-12 hours (1.5 days)**

---

## 📋 Table of Contents
1. [Problem Statement and Goals](#problem-statement-and-goals)
2. [Safety and Fallback Plan](#safety-and-fallback-plan)
3. [Task Breakdown and Timeline](#task-breakdown-and-timeline)
4. [Emergency Procedures](#emergency-procedures)
5. [Success Criteria](#success-criteria)

---

## Problem Statement and Goals

### **Objective**
Implement comprehensive unit tests for the Access Control List (ACL) API to:
- Achieve 80%+ code coverage
- Ensure API reliability and prevent regressions
- Follow industry-standard testing practices (Jest + NestJS)
- **Zero impact on production/running application**

### **Why ACL API First?**
1. ✅ Critical authentication/authorization functionality
2. ✅ Simple, clear business logic (good for learning)
3. ✅ Already has partial test examples
4. ✅ Clear 3-layer architecture (Controller → Service → Repository)

### **Expected Outcomes**
- 15+ controller tests
- 10+ service tests
- 8+ repository tests
- 80%+ overall coverage
- All tests passing (green)
- < 10 seconds execution time

---

## Safety and Fallback Plan

### 🛡️ **Zero-Impact Testing Strategy**

**Goal:** Implement unit tests WITHOUT affecting the running application

### ✅ **What Testing DOES:**
- Runs in isolated test environment
- Uses mock data (not real database)
- Executes in separate Jest process
- Creates coverage reports in `/coverage` folder

### ✅ **What Testing DOES NOT:**
- Touch production database
- Modify existing code logic
- Change API behavior
- Affect running services
- Impact live users

### **File Structure - Safe Separation**

```
apps/services/auth-service/src/app/access-control-list/
│
├── access-control-list.controller.ts       ← PRODUCTION CODE (Don't touch)
├── access-control-list.service.ts          ← PRODUCTION CODE (Don't touch)
├── access-control-list.repository.ts       ← PRODUCTION CODE (Don't touch)
│
├── access-control-list.controller.spec.ts  ← NEW TEST FILE (Safe to add)
├── access-control-list.service.spec.ts     ← NEW TEST FILE (Safe to add)
└── access-control-list.repository.spec.ts  ← NEW TEST FILE (Safe to add)
```

**Rule:** Test files (`.spec.ts`) are **completely separate** from production code

### **Impact Assessment**

| Action | Production Impact | Rollback Time | Risk Level |
|--------|-------------------|---------------|------------|
| Create .spec.ts files | ✅ ZERO | Instant (delete files) | 🟢 None |
| Run `nx test` command | ✅ ZERO | N/A (just a command) | 🟢 None |
| Generate coverage report | ✅ ZERO | Instant (delete /coverage) | 🟢 None |
| Commit test files to branch | ✅ ZERO | 1 min (revert commit) | 🟢 None |
| Merge to main branch | ✅ ZERO* | 5 min (revert merge) | 🟡 Low* |
| Modify production .ts files | ⚠️ HIGH | 10 min (code review needed) | 🔴 High |

*Even merging test files has zero production impact because:
- Production builds ignore `.spec.ts` files
- Jest only runs in dev/test environments
- CI/CD doesn't execute tests in production deployment

### **Pre-Flight Checklist (Before Starting)**

| # | Check | Command | Expected Result | ✓ |
|---|-------|---------|-----------------|---|
| 1 | Git working tree clean | `git status` | "nothing to commit" | ☐ |
| 2 | On correct branch | `git branch --show-current` | "docs/product-team" | ☐ |
| 3 | Latest code pulled | `git pull` | "Already up to date" | ☐ |
| 4 | Node modules installed | `ls node_modules` | Folder exists | ☐ |
| 5 | Jest working | `npx nx test auth-service --version` | Version displays | ☐ |
| 6 | Production app running | Check dev server | App accessible | ☐ |
| 7 | Backup branch created | `git checkout -b backup-$(date +%Y%m%d)` | Branch created | ☐ |

---

## Task Breakdown and Timeline

## Task List with Hours

| # | Task | Duration | Cumulative | Owner |
|---|------|----------|------------|-------|
| **1** | **Setup & Environment** | | | |
| 1.1 | Understand existing ACL codebase | 30 min | 0.5h | Developer |
| 1.2 | Review existing test files | 30 min | 1h | Developer |
| 1.3 | Run current tests and analyze coverage | 30 min | 1.5h | Developer |
| 1.4 | Set up test environment and dependencies | 30 min | 2h | Developer |
| **2** | **Controller Testing** | | | |
| 2.1 | Write basic controller tests (setup, defined) | 30 min | 2.5h | Developer |
| 2.2 | Test GET /access-control-list (getAclMetadata) | 45 min | 3.25h | Developer |
| 2.3 | Test GET /access-control-list?role=:id (getRoleAcl) | 45 min | 4h | Developer |
| 2.4 | Test PUT /access-control-list/role/:id (updateRoleAcl) | 45 min | 4.75h | Developer |
| 2.5 | Test GET /permissions (getUserPermissions) | 45 min | 5.5h | Developer |
| 2.6 | Test error scenarios for all endpoints | 30 min | 6h | Developer |
| **3** | **Service Testing** | | | |
| 3.1 | Write basic service tests (setup, defined) | 20 min | 6.33h | Developer |
| 3.2 | Test getUserPermissions method | 25 min | 6.75h | Developer |
| 3.3 | Test getAclMetadata method | 20 min | 7h | Developer |
| 3.4 | Test getRoleAcl method | 20 min | 7.33h | Developer |
| 3.5 | Test updateRoleAcl method | 25 min | 7.75h | Developer |
| 3.6 | Test error propagation scenarios | 20 min | 8h | Developer |
| **4** | **Repository Testing** | | | |
| 4.1 | Write basic repository tests (setup, defined) | 20 min | 8.33h | Developer |
| 4.2 | Test getUserPermissions with TypeORM mocking | 40 min | 9h | Developer |
| 4.3 | Test getAclMetadata database query | 30 min | 9.5h | Developer |
| 4.4 | Test getRoleAcl database query | 30 min | 10h | Developer |
| 4.5 | Test updateRoleAcl transaction | 40 min | 10.67h | Developer |
| 4.6 | Test edge cases (no roles, empty data) | 30 min | 11h | Developer |
| **5** | **Coverage & Quality** | | | |
| 5.1 | Run coverage report and identify gaps | 20 min | 11.33h | Developer |
| 5.2 | Write additional tests to reach 80%+ coverage | 30 min | 12h | Developer |
| 5.3 | Fix failing tests and edge cases | 20 min | 12.33h | Developer |
| 5.4 | Code review and cleanup | 20 min | 12.67h | Developer/Lead |
| **6** | **Documentation & Handoff** | | | |
| 6.1 | Document test coverage results | 15 min | 12.92h | Developer |
| 6.2 | Create test execution guide | 15 min | 13.17h | Developer |
| 6.3 | Team demo and knowledge sharing | 30 min | 13.67h | Team |

---

## Summary by Phase

| Phase | Tasks | Total Hours | % of Project |
|-------|-------|-------------|--------------|
| Setup & Environment | 4 tasks | 2h | 15% |
| Controller Testing | 6 tasks | 3.5h | 26% |
| Service Testing | 6 tasks | 1.75h | 13% |
| Repository Testing | 6 tasks | 2.67h | 20% |
| Coverage & Quality | 4 tasks | 1.33h | 10% |
| Documentation & Handoff | 3 tasks | 1h | 7% |
| **Buffer (contingency)** | - | 1.42h | 10% |
| **TOTAL** | **29 tasks** | **13.67h** | **100%** |

---

## Deliverables Checklist

| # | Deliverable | Status |
|---|-------------|--------|
| 1 | Controller test file with 15+ test cases | ☐ |
| 2 | Service test file with 10+ test cases | ☐ |
| 3 | Repository test file with 8+ test cases | ☐ |
| 4 | Overall coverage report showing 80%+ | ☐ |
| 5 | All tests passing (green) | ☐ |
| 6 | Test execution time < 10 seconds | ☐ |
| 7 | Documentation of test scenarios | ☐ |
| 8 | Knowledge transfer to team | ☐ |

---

## Resource Requirements

| Resource | Quantity | Duration |
|----------|----------|----------|
| Senior/Mid-level Developer | 1 | 13.67 hours |
| Tech Lead (Code Review) | 1 | 1 hour |
| QA (Optional - Validation) | 1 | 1 hour |

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Code Coverage - Controller | > 80% | Jest coverage report |
| Code Coverage - Service | > 90% | Jest coverage report |
| Code Coverage - Repository | > 85% | Jest coverage report |
| Code Coverage - Overall | > 80% | Jest coverage report |
| Test Pass Rate | 100% | All tests green |
| Test Execution Time | < 10 sec | Jest output |
| Bugs Found Post-Testing | 0 | Production monitoring |

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| TypeORM mocking complexity | Medium | High | Use existing patterns from other tests |
| Developer unfamiliar with Jest | Low | Medium | Provide TESTING_GUIDE.md reference |
| Coverage targets not met | Low | Medium | Add buffer time for additional tests |
| Tests taking too long to run | Low | Low | Optimize queries, use proper mocks |

---

## Dependencies

| Dependency | Required For | Status |
|------------|--------------|--------|
| Jest installed | All testing | ✅ Available |
| @nestjs/testing | Controller/Service tests | ✅ Available |
| TypeORM | Repository tests | ✅ Available |
| Existing test examples | Learning patterns | ✅ Available |
| Coverage tools | Coverage reporting | ✅ Available |

---

## Timeline View (Gantt-style)

```
Day 1 (8 hours)
├── 0-2h:    Setup & Environment (Tasks 1.1-1.4)
├── 2-6h:    Controller Testing (Tasks 2.1-2.6)
└── 6-8h:    Service Testing (Tasks 3.1-3.6)

Day 2 (5.67 hours)
├── 0-2.67h: Repository Testing (Tasks 4.1-4.6)
├── 2.67-4h: Coverage & Quality (Tasks 5.1-5.4)
└── 4-5.67h: Documentation & Handoff (Tasks 6.1-6.3)
```

---

## Quick Command Reference

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `npx nx test auth-service` | Run all tests | After each phase |
| `npx nx test auth-service --coverage` | Get coverage report | End of day/phase |
| `npx nx test auth-service --watch` | Auto-rerun tests | During development |
| `npx nx test auth-service --testFile=access-control-list.controller.spec.ts` | Run specific file | Testing individual layer |

---

## Next APIs After ACL

| API | Service | Complexity | Estimated Hours |
|-----|---------|------------|-----------------|
| Company API | org-service | Medium | 14-16h |
| Employee API | org-service | High | 16-18h |
| Policy API | policy-service | High | 18-20h |
| Opportunity API | opportunity-service | Very High | 20-24h |

---

## Emergency Procedures

### **Emergency Rollback Procedures**

#### **Scenario 1: Test Files Causing Build Issues**

```bash
# Quick fix: Remove all test files
git checkout docs/product-team
git branch -D feature/acl-tests

# Or: Remove specific test file
rm apps/services/auth-service/src/app/access-control-list/*.spec.ts
git checkout .
```

**Time to recover:** < 1 minute

#### **Scenario 2: Accidentally Modified Production Code**

```bash
# Check what was modified
git diff apps/services/auth-service/src/app/access-control-list/access-control-list.controller.ts

# Discard changes to production file
git checkout apps/services/auth-service/src/app/access-control-list/access-control-list.controller.ts

# Or: Discard all changes
git checkout .
```

**Time to recover:** < 2 minutes

#### **Scenario 3: Tests Breaking CI/CD Pipeline**

```bash
# Revert the merge commit
git revert -m 1 <merge-commit-hash>
git push

# Or: Revert specific commit
git revert <commit-hash>
git push
```

**Time to recover:** < 5 minutes

#### **Scenario 4: Need to Start Over Completely**

```bash
# Nuclear option: Delete branch and start fresh
git checkout docs/product-team
git branch -D feature/acl-tests
git push origin --delete feature/acl-tests

# Verify clean state
git status  # Should show "nothing to commit, working tree clean"
```

**Time to recover:** < 3 minutes

### **Worst-Case Scenario Plan**

**If everything goes wrong:**

1. **Stop all work** (< 1 min)
2. **Checkout main branch:** `git checkout docs/product-team` (< 1 min)
3. **Delete test branch:** `git branch -D feature/acl-tests` (< 1 min)
4. **Verify production:** Check app is working (< 2 min)
5. **Document issues:** Note what went wrong (< 5 min)
6. **Regroup:** Discuss with team, revise approach (< 30 min)

**Total recovery time:** < 10 minutes

---

## Success Criteria

### **Validation Gates (Must Pass Before Merge)**

| Gate | Validation | Pass Criteria | Fail Action |
|------|------------|---------------|-------------|
| **Gate 1: File Safety** | `git diff --name-only` | Only `.spec.ts` files | Discard production changes |
| **Gate 2: Test Pass** | `nx test auth-service` | All tests green | Fix failing tests |
| **Gate 3: Coverage** | Coverage report | > 80% overall | Add more tests |
| **Gate 4: Build** | `nx build auth-service` | Build successful | Fix build errors |
| **Gate 5: No Side Effects** | Run production app | App works normally | Investigate issues |
| **Gate 6: Code Review** | Team review | Approved by lead | Address feedback |

### **Final Success Checklist**

| Criterion | Validation Method | ✓ |
|-----------|-------------------|---|
| Production app still runs | Manual testing | ☐ |
| No database changes | Check DB schema | ☐ |
| No API behavior changes | API tests still pass | ☐ |
| Build still works | `nx build` succeeds | ☐ |
| Only .spec.ts files added | `git diff --name-only` | ☐ |
| All new tests pass | `nx test` green | ☐ |
| Coverage improved | > 80% coverage | ☐ |
| Team approved | PR approved | ☐ |

### **Confidence Levels**

| Activity | Confidence | Reason |
|----------|------------|--------|
| Creating .spec.ts files | 🟢 100% safe | Completely isolated from production |
| Running nx test | 🟢 100% safe | Uses mocks, no real DB/APIs |
| Generating coverage | 🟢 100% safe | Just creates HTML files |
| Committing to feature branch | 🟢 100% safe | Isolated branch |
| Merging to main | 🟢 99% safe | Tests excluded from builds |
| Production deployment | 🟢 100% safe | .spec.ts files not deployed |

---

## Safe Testing Workflow

```
START
  ↓
1. Create backup branch ──────────────────┐
  ↓                                        │ ROLLBACK: Delete branch
2. Create test branch                      │
  ↓                                        │
3. Write .spec.ts files (NO .ts changes) ─┤
  ↓                                        │
4. Run tests locally                       │
  ↓                                        │
5. All tests pass? ──NO──> Fix tests ─────┤
  ↓ YES                                    │
6. Coverage > 80%? ──NO──> Add tests ─────┤
  ↓ YES                                    │
7. Production code unchanged? ──NO────────┘
  ↓ YES
8. Commit test files only
  ↓
9. Push to remote
  ↓
10. Create Pull Request
  ↓
11. Code review & approval
  ↓
12. Merge to main
  ↓
END (Production still safe!)
```

---

## Quick Start Commands

### **Step 1: Setup (5 minutes)**
```bash
# Check status and create branch
git status
git checkout -b feature/acl-api-unit-tests
git push -u origin feature/acl-api-unit-tests
```

### **Step 2: Run Existing Tests (5 minutes)**
```bash
# Run auth-service tests
npx nx test auth-service

# Run with coverage
npx nx test auth-service --coverage

# View coverage report
open apps/services/auth-service/coverage/lcov-report/index.html
```

### **Step 3: Development (8-10 hours)**
```bash
# Run tests in watch mode during development
npx nx test auth-service --watch

# Run specific test file
npx nx test auth-service --testFile=access-control-list.controller.spec.ts
```

### **Step 4: Validation (30 minutes)**
```bash
# Final coverage check
npx nx test auth-service --coverage

# Verify no production code changed
git diff apps/services/auth-service/src/app/access-control-list/access-control-list.controller.ts
git diff apps/services/auth-service/src/app/access-control-list/access-control-list.service.ts
git diff apps/services/auth-service/src/app/access-control-list/access-control-list.repository.ts

# Should show: no changes (only .spec.ts files should be modified)
```

### **Step 5: Commit & Push**
```bash
# Stage only test files
git add apps/services/auth-service/src/app/access-control-list/*.spec.ts

# Commit with clear message
git commit -m "test: Add comprehensive unit tests for ACL API

- Add controller tests (15+ test cases)
- Add service tests (10+ test cases)
- Add repository tests (8+ test cases)
- Achieve 80%+ code coverage
- Zero production code changes"

# Push to remote
git push
```

---

## Monitoring & Communication

### **What to Monitor During Testing:**

| Metric | How to Check | Red Flag | Action |
|--------|--------------|----------|--------|
| Production app status | Open `http://localhost:3000` | App not loading | Stop testing, investigate |
| Database connections | Check DB logs | Unexpected queries | Verify tests use mocks |
| Memory usage | Activity Monitor (Mac) | > 80% | Reduce concurrent tests |
| Test execution time | Jest output | > 30 seconds | Optimize test setup |
| Git branch | `git branch --show-current` | On wrong branch | Stash changes, switch branch |

### **Communication Plan**

#### **Before Starting:**
- ✅ Notify team: "Starting ACL API testing on feature branch"
- ✅ Share branch name: `feature/acl-api-unit-tests`
- ✅ Confirm production is unaffected

#### **During Development:**
- ✅ Daily updates on progress
- ✅ Report any blockers immediately
- ✅ Share coverage improvements

#### **Before Merge:**
- ✅ Demo working tests to team
- ✅ Show coverage report (80%+)
- ✅ Confirm zero production impact
- ✅ Get approval from tech lead

---

**Total Project Timeline: 1.5 working days (13.67 hours)**

**Recommended Approach:** Complete in 2 days with buffer for learning curve and edge cases.

**Bottom Line:** Unit testing is **100% safe** when following this plan. Production code and running application are **completely isolated** from test development.

---

## ACL API - Code Templates

### **File Structure**

```
apps/services/auth-service/src/app/access-control-list/
├── access-control-list.controller.ts       ← PRODUCTION (Don't modify)
├── access-control-list.service.ts          ← PRODUCTION (Don't modify)
├── access-control-list.repository.ts       ← PRODUCTION (Don't modify)
├── access-control-list.controller.spec.ts  ← CREATE THIS
├── access-control-list.service.spec.ts     ← CREATE THIS
└── access-control-list.repository.spec.ts  ← CREATE THIS
```

---

### **Template 1: Controller Tests**

**File:** `apps/services/auth-service/src/app/access-control-list/access-control-list.controller.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { AccessControlListController } from './access-control-list.controller';
import { AccessControlListService } from './access-control-list.service';
import { HttpStatus } from '@nestjs/common';
import { createResponse, createErrorResponse } from '../../../../../libs/service-lib/src/lib/utils/response.utils';

describe('AccessControlListController - Complete Test Suite', () => {
  let controller: AccessControlListController;
  let service: AccessControlListService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccessControlListController],
      providers: [
        {
          provide: AccessControlListService,
          useValue: {
            getUserPermissions: jest.fn(),
            getAclMetadata: jest.fn(),
            getRoleAcl: jest.fn(),
            updateRoleAcl: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AccessControlListController>(AccessControlListController);
    service = module.get<AccessControlListService>(AccessControlListService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Setup', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should have service injected', () => {
      expect(service).toBeDefined();
    });
  });

  describe('GET /access-control-list (getAclMetadata)', () => {
    it('should return ACL metadata successfully', async () => {
      const mockMetadata = [
        {
          id: 1,
          name: 'Company',
          categoryKey: 'company',
          actions: [
            { id: 1, name: 'Read', actionKey: 'read' },
            { id: 2, name: 'Write', actionKey: 'write' }
          ]
        }
      ];

      jest.spyOn(service, 'getAclMetadata').mockResolvedValue(mockMetadata);

      const mockResponse: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await controller.getAclMetadata('', mockResponse);

      expect(service.getAclMetadata).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith(
        createResponse(HttpStatus.OK, 'ACL metadata retrieved successfully', mockMetadata)
      );
    });

    it('should handle database errors gracefully', async () => {
      jest.spyOn(service, 'getAclMetadata').mockRejectedValue(
        new Error('Database connection failed')
      );

      const mockResponse: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await controller.getAclMetadata('', mockResponse);

      expect(service.getAclMetadata).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  describe('GET /access-control-list?role=:roleId (getRoleAcl)', () => {
    it('should return ACL for specific role', async () => {
      const roleId = 1;
      const mockRoleAcl = [1, 2, 3, 5, 8];

      jest.spyOn(service, 'getRoleAcl').mockResolvedValue(mockRoleAcl);

      const mockResponse: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await controller.getAclMetadata(roleId.toString(), mockResponse);

      expect(service.getRoleAcl).toHaveBeenCalledWith(roleId);
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith(
        createResponse(HttpStatus.OK, 'Role ACL retrieved successfully', mockRoleAcl)
      );
    });
  });

  describe('PUT /access-control-list/role/:roleId (updateRoleAcl)', () => {
    it('should update role ACL successfully', async () => {
      const roleId = '1';
      const updateDto = { aclIds: [1, 2, 3, 5] };

      jest.spyOn(service, 'updateRoleAcl').mockResolvedValue(true);

      const mockResponse: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await controller.updateRoleAcl(roleId, updateDto, mockResponse);

      expect(service.updateRoleAcl).toHaveBeenCalledWith(1, [1, 2, 3, 5]);
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith(
        createResponse(HttpStatus.OK, 'Role ACL updated successfully')
      );
    });

    it('should handle update errors', async () => {
      const roleId = '1';
      const updateDto = { aclIds: [1, 2, 3] };

      jest.spyOn(service, 'updateRoleAcl').mockRejectedValue(
        new Error('Failed to update ACL')
      );

      const mockResponse: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await controller.updateRoleAcl(roleId, updateDto, mockResponse);

      expect(service.updateRoleAcl).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });
});
```

---

### **Template 2: Service Tests**

**File:** `apps/services/auth-service/src/app/access-control-list/access-control-list.service.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { AccessControlListService } from './access-control-list.service';
import { AccessControlListRepository } from './access-control-list.repository';

describe('AccessControlListService - Complete Test Suite', () => {
  let service: AccessControlListService;
  let repository: AccessControlListRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccessControlListService,
        {
          provide: AccessControlListRepository,
          useValue: {
            getUserPermissions: jest.fn(),
            getAclMetadata: jest.fn(),
            getRoleAcl: jest.fn(),
            updateRoleAcl: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AccessControlListService>(AccessControlListService);
    repository = module.get<AccessControlListRepository>(AccessControlListRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserPermissions', () => {
    it('should return user permissions from repository', async () => {
      const userId = 123;
      const mockPermissions = {
        roleId: 1,
        roleName: 'Admin',
        access: {
          Company: { read: true, write: true },
          Policy: { read: true, write: false }
        }
      };

      jest.spyOn(repository, 'getUserPermissions').mockResolvedValue(mockPermissions);

      const result = await service.getUserPermissions(userId);

      expect(repository.getUserPermissions).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockPermissions);
    });

    it('should propagate repository errors', async () => {
      const userId = 123;
      const error = new Error('User not found');

      jest.spyOn(repository, 'getUserPermissions').mockRejectedValue(error);

      await expect(service.getUserPermissions(userId)).rejects.toThrow('User not found');
    });
  });

  describe('getAclMetadata', () => {
    it('should return ACL metadata from repository', async () => {
      const mockMetadata = [{ id: 1, name: 'Company', actions: [] }];

      jest.spyOn(repository, 'getAclMetadata').mockResolvedValue(mockMetadata);

      const result = await service.getAclMetadata();

      expect(repository.getAclMetadata).toHaveBeenCalled();
      expect(result).toEqual(mockMetadata);
    });
  });

  describe('getRoleAcl', () => {
    it('should return role ACL from repository', async () => {
      const roleId = 1;
      const mockAclIds = [1, 2, 3, 5, 8];

      jest.spyOn(repository, 'getRoleAcl').mockResolvedValue(mockAclIds);

      const result = await service.getRoleAcl(roleId);

      expect(repository.getRoleAcl).toHaveBeenCalledWith(roleId);
      expect(result).toEqual(mockAclIds);
    });
  });

  describe('updateRoleAcl', () => {
    it('should update role ACL via repository', async () => {
      const roleId = 1;
      const aclIds = [1, 2, 3];

      jest.spyOn(repository, 'updateRoleAcl').mockResolvedValue(true);

      const result = await service.updateRoleAcl(roleId, aclIds);

      expect(repository.updateRoleAcl).toHaveBeenCalledWith(roleId, aclIds);
      expect(result).toBe(true);
    });
  });
});
```

---

### **Template 3: Repository Tests (TypeORM Mocking)**

**File:** `apps/services/auth-service/src/app/access-control-list/access-control-list.repository.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { AccessControlListRepository } from './access-control-list.repository';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserRole } from '../../../../service-lib/src/lib/entities/user-role.entity';
import { RoleAclCategoryActionMap } from '../../../../service-lib/src/lib/entities/role-acl-category-action-map.entity';
import { AclCategoryActionMap } from '../../../../service-lib/src/lib/entities/acl-category-action-map.entity';

describe('AccessControlListRepository', () => {
  let repository: AccessControlListRepository;
  let userRoleRepository: Repository<UserRole>;
  let roleAclMapRepository: Repository<RoleAclCategoryActionMap>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccessControlListRepository,
        {
          provide: getRepositoryToken(UserRole),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(RoleAclCategoryActionMap),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(AclCategoryActionMap),
          useClass: Repository,
        },
      ],
    }).compile();

    repository = module.get<AccessControlListRepository>(AccessControlListRepository);
    userRoleRepository = module.get<Repository<UserRole>>(getRepositoryToken(UserRole));
    roleAclMapRepository = module.get<Repository<RoleAclCategoryActionMap>>(
      getRepositoryToken(RoleAclCategoryActionMap)
    );
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  it('should return permissions when user roles exist', async () => {
    const mockUserRoles = [
      { role: { id: 1, name: 'Admin' } }
    ];

    const mockRolePermissions = [
      {
        aclCategoryActionMap: {
          aclCategory: { name: 'Company', categoryKey: 'company', applicationScope: 'iwork' },
          aclAction: { name: 'Read', actionKey: 'read' },
        },
      },
    ];

    jest.spyOn(userRoleRepository, 'createQueryBuilder').mockReturnValueOnce({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(mockUserRoles),
    } as any);

    jest.spyOn(roleAclMapRepository, 'createQueryBuilder').mockReturnValueOnce({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(mockRolePermissions),
    } as any);

    const result = await repository.getUserPermissions(123);

    expect(result).toHaveProperty('roleId', 1);
    expect(result).toHaveProperty('roleName', 'Admin');
    expect(result.access).toHaveProperty('iwork');
  });
});
```

---

## Quick Reference - Jest Patterns for ACL

### **1. Mock Service Response**
```typescript
jest.spyOn(service, 'getAclMetadata').mockResolvedValue(mockData);
```

### **2. Mock Error**
```typescript
jest.spyOn(service, 'getRoleAcl').mockRejectedValue(new Error('DB Error'));
```

### **3. Mock HTTP Response**
```typescript
const mockResponse: any = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
};
```

### **4. Assert Method Called**
```typescript
expect(service.getUserPermissions).toHaveBeenCalledWith(userId);
expect(service.getUserPermissions).toHaveBeenCalledTimes(1);
```

### **5. Assert Response Status**
```typescript
expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
expect(mockResponse.json).toHaveBeenCalledWith(expectedData);
```

### **6. Mock TypeORM Query Builder**
```typescript
jest.spyOn(repository, 'createQueryBuilder').mockReturnValueOnce({
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  getMany: jest.fn().mockResolvedValue(mockData),
} as any);
```

---

## Running ACL Tests

```bash
# Run all ACL tests
npx nx test auth-service --testFile=access-control-list

# Run specific test file
npx nx test auth-service --testFile=access-control-list.controller.spec.ts

# Run with coverage
npx nx test auth-service --coverage

# Watch mode (auto-rerun on changes)
npx nx test auth-service --watch --testFile=access-control-list

# Verbose output
npx nx test auth-service --testFile=access-control-list --verbose
```

---

**End of Document**
