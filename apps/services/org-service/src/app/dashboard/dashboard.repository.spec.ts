import { Test, TestingModule } from "@nestjs/testing";
import { DashboardRepository } from "./dashboard.repository";

describe("DashboardRepository", () => {
  let repository: DashboardRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DashboardRepository],
    }).compile();

    repository = module.get<DashboardRepository>(DashboardRepository);
  });

  it("should be defined", () => {
    expect(repository).toBeDefined();
  });
});
