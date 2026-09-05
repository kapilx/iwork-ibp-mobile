## Follow all the rules below for code generation

1. **Unite Related Tests in a Suite**

   - Group related tests using `describe` blocks (in Jest, Mocha, etc.) to maintain organization and improve readability.

2. **Descriptive Test Names**

   - Use clear, specific names for test cases that describe what is being tested and under what conditions.

3. **Mock External Dependencies**

   - Mock APIs, databases, or third-party services to isolate the logic being tested and ensure tests are fast and reliable.

4. **Test Edge Cases**

   - Include tests for boundary conditions, empty inputs, invalid values, and other edge scenarios.

5. **Setup and Teardown Logic**

   - Use setup (e.g., `beforeEach`) and teardown (e.g., `afterEach`) hooks to initialize and clean the test environment.

6. **Code Coverage**

   - Aim for at least 80–90% code coverage while ensuring meaningful coverage that includes various branches and logic flows.

7. **Assertions**

   - Use relevant assertions (e.g., `toEqual`, `toBeTruthy`, `toThrow`) to verify both expected outcomes and side effects.

8. **Avoid Testing Implementation Details**

   - Focus on public behavior of units, not private/internal logic. This improves test maintainability.

9. **Use Constants for Repeated Values**

   - Define reusable constants or fixtures to avoid hardcoding values repeatedly across tests.

10. **Document Test Cases**

    - Add inline comments to clarify why a specific scenario is tested or explain non-obvious assertions.

11. **Write Independent Tests**

    - Ensure each test runs in isolation. One test should not depend on the output or side effects of another.

12. **Fail Fast, Fail Loud**

    - Write tests in a way that makes failures obvious and easy to trace.

13. **Name Mocks Clearly**

    - Use descriptive variable names for mocks, spies, and stubs to enhance readability.

14. **Avoid Over-Mocking**

    - Mock only what’s necessary. Over-mocking can lead to brittle tests and false positives.

15. **Test Positive and Negative Scenarios**

    - Validate both successful and failing conditions to ensure robust functionality.

16. **Use Factories or Builders for Complex Test Data**

    - Use data builders or factories for generating test data, especially for objects with many fields.

17. **Keep Tests Fast**

    - Unit tests should run quickly (< 1s). If a test is slow, consider moving it to an integration test suite.

18. **Follow Arrange-Act-Assert Pattern**

    - Structure your test code into three distinct sections: setup the test, execute the action, and assert the result.

19. **Test Only One Thing per Test Case**

    - Keep tests focused. One test case should ideally validate one specific behavior or output.

20. **Ensure Idempotency in Tests** _(Additional Instruction)_

    - Tests should be repeatable and produce the same result every time they are executed.

21. **Verify Side Effects** _(Additional Instruction)_

    - If a function modifies the state, database, or files, verify that the changes are as expected.

22. **Use Meaningful Test Data** _(Additional Instruction)_

    - Use realistic test data that mimics production scenarios rather than generic placeholders like `test123` or `example.com`.
    - Data types of the data should match with existing data models referred in the logic that is being tested.

23. **Ensure Parallel Execution Compatibility** _(Additional Instruction)_

    - Design tests so they can run in parallel without interfering with each other, especially when dealing with shared resources.

24. **Log Useful Debug Information** _(Additional Instruction)_

    - When debugging, provide detailed logs and assertions to make test failures easy to diagnose.

25. **Avoid Hardcoded Sleep Delays** _(Additional Instruction)_

    - Instead of `setTimeout`, use polling mechanisms (e.g., `waitFor` in Jest) to ensure proper synchronization.

26. **Don't modify the other files**
    - when asked for unit test cases generation only modify test files, don't modify any other files until and unless the logic is incorrect.
