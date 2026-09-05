# IIRM-7631 IBP Claims Corner (Phase 1) - Technical Tasks

## Project Overview

**Epic:** Claims Corner Phase 1  
**Feature:** View Claims Details  
**Total Story Points:** 104  
**Estimated Timeline:** 8-10 sprints (2-week sprints)

## Phase 1 Scope

✅ Claims Summary on Dashboard  
✅ Claims Corner screen view

## Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   IIRM Portal   │────│  Sync Service    │────│ Enrollment DB   │
│ (Claims Upload) │    │  (Data Sync)     │    │ (Claims Table)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
┌─────────────────┐    ┌──────────────────┐             │
│ Dashboard Widget│────│  Claims APIs     │─────────────┘
│   (Summary)     │    │ (Summary/List)   │
└─────────────────┘    └──────────────────┘
                                │
┌─────────────────┐             │
│ Claims Corner   │─────────────┘
│   (Detailed)    │
└─────────────────┘
```

## Backend Tasks Summary

| Task | Story Points | Priority | Dependencies |
|------|--------------|----------|--------------|
| Database Schema | 8 | High | None |
| Claims Summary API | 5 | High | Database Schema |
| Claims List API | 8 | High | Database Schema |
| Coverage Calculation API | 6 | Medium | Claims APIs |
| Premium Summary API | 5 | Medium | Policy Data |
| Claims Sync Service | 13 | High | Database Schema |
| Policy Validation Logic | 5 | Medium | Claims APIs |
| Error Handling & Logging | 3 | Low | All APIs |

**Backend Total: 53 Story Points**

## Frontend Tasks Summary

| Task | Story Points | Priority | Dependencies |
|------|--------------|----------|--------------|
| Dashboard Claims Widget | 8 | High | Claims Summary API |
| Claims Corner Main Page | 8 | High | All APIs |
| Policy Information Section | 6 | Medium | Claims APIs |
| Life Event Update Card | 3 | Low | None |
| Parental Policy & Add-ons | 5 | Medium | Coverage API |
| Premium Summary Component | 6 | Medium | Premium API |
| Responsive Design & Styling | 5 | Low | All Components |

**Frontend Total: 41 Story Points**

## Testing Tasks Summary

| Task | Story Points | Priority | Dependencies |
|------|--------------|----------|--------------|
| Comprehensive Test Suite | 10 | High | All Features |

**Testing Total: 10 Story Points**

## Implementation Phases

### Phase 1 (Sprint 1-2): Foundation
1. Database Schema
2. Claims Summary API
3. Claims Sync Service

### Phase 2 (Sprint 3-4): Core APIs
1. Claims List API
2. Coverage Calculation API
3. Premium Summary API

### Phase 3 (Sprint 5-6): Frontend Core
1. Dashboard Claims Widget
2. Claims Corner Main Page
3. Policy Information Section

### Phase 4 (Sprint 7-8): Enhancement & Polish
1. Additional Components
2. Responsive Design
3. Error Handling
4. Comprehensive Testing

## Technical Dependencies

- **Database:** PostgreSQL with TypeORM
- **Backend:** NestJS framework
- **Frontend:** React with TypeScript
- **Authentication:** Existing middleware
- **Caching:** Redis (for calculations)
- **Testing:** Jest, React Testing Library, Cypress

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| IIRM Portal API changes | High | Mock service for development |
| Database performance | Medium | Proper indexing and caching |
| Complex calculations | Medium | Unit tests and validation |
| Mobile responsiveness | Low | Progressive development |

## Success Criteria

1. ✅ Dashboard shows claims summary for all policy types
2. ✅ Claims Corner displays detailed policy information
3. ✅ Real-time data sync from IIRM portal
4. ✅ Responsive design across all devices
5. ✅ 80%+ code coverage with tests
6. ✅ Sub 500ms API response times

---

*Document prepared for Technical Lead review*  
*Date: November 19, 2025*  
*Prepared by: Richa*