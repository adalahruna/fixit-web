# FixIt Testing Framework

Comprehensive testing suite for the FixIt booking system including unit tests, integration tests, and black-box testing scenarios.

## Overview

The testing framework provides:
- **Unit Tests**: Test individual functions and business logic
- **Integration Tests**: Test complete user workflows and interactions  
- **Black-box Tests**: Test system behavior from user perspective
- **Test Reports**: Automated report generation with coverage analysis

## Test Structure

```
frontend/src/lib/testing/
├── test-utils.ts          # Test data and utilities
├── unit-tests.ts          # Unit test suites
├── integration-tests.ts   # Integration test runner
├── test-report.ts         # Report generation
└── README.md             # This file
```

## Test Users

The framework includes predefined test users for each role:

| Email | Password | Role | Purpose |
|-------|----------|------|---------|
| customer@test.com | test123 | Customer | Test booking flows |
| admin@bengkel.com | admin123 | Admin | Test management features |
| mechanic@bengkel.com | mechanic123 | Mechanic | Test service operations |
| owner@bengkel.com | owner123 | Owner | Test analytics and monitoring |

## Test Scenarios

### Customer Role Tests
- **Booking Creation Flow**: Complete booking process from form to confirmation
- **Booking Management**: Viewing, rescheduling, and canceling bookings
- **Real-time Updates**: Status updates and notifications

### Admin Role Tests
- **Booking Management**: Assigning mechanics and managing bookings
- **Master Data CRUD**: Service types and mechanics management
- **SLA Monitoring**: Overload detection and SLA tracking

### Mechanic Role Tests
- **Queue Management**: Viewing and managing assigned bookings
- **Service Progress**: Starting and completing services

### Owner Role Tests
- **KPI Dashboard**: Business metrics and analytics
- **Audit Logs**: Audit trail and system monitoring

## Running Tests

### Manual Testing
1. Use the test users provided above to login with different roles
2. Follow the test scenarios for each role systematically
3. Verify that all features work as expected
4. Test error handling and edge cases
5. Document any issues or unexpected behavior

### Automated Testing
```bash
# Run all tests
npm run test

# Run specific test types
npm run test:unit           # Unit tests only
npm run test:integration    # Integration tests only
npm run test:watch         # Watch mode for development
npm run test:coverage      # Generate coverage report
```

## Test Data

### Sample Bookings
The framework includes realistic test booking data:

1. **Standard Booking**: Motor Matic - Ganti Oli
2. **Multiple Services**: Motor Sport - Tune Up + Ganti Oli  
3. **Consultation Only**: Motor Bebek - Konsultasi Rem

### Test Validation Rules
- Required fields validation
- Business rule validation (BR-11: consultation required if no services)
- Slot availability validation
- Role-based access control

## Coverage Goals

- **Unit Test Coverage**: >80% for business logic functions
- **Integration Test Coverage**: All major user workflows
- **Black-box Test Coverage**: All user roles and scenarios
- **Error Handling**: All error conditions and edge cases

## Test Reports

The framework generates comprehensive test reports including:
- Test execution summary (pass/fail rates)
- Coverage analysis by test type
- Detailed test results with error information
- Recommendations for improvement
- HTML and Markdown report formats

## Integration with CI/CD

Tests can be integrated into continuous integration pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run Tests
  run: |
    npm install
    npm run test:coverage
    
- name: Upload Coverage
  uses: codecov/codecov-action@v1
```

## Best Practices

### Writing Tests
1. **Descriptive Names**: Use clear, descriptive test names
2. **Arrange-Act-Assert**: Follow the AAA pattern
3. **Independent Tests**: Each test should be independent
4. **Mock External Dependencies**: Mock Supabase and external APIs
5. **Test Edge Cases**: Include boundary conditions and error scenarios

### Test Data Management
1. **Use Test Constants**: Leverage predefined test data
2. **Clean State**: Ensure tests start with clean state
3. **Realistic Data**: Use realistic test scenarios
4. **Data Isolation**: Avoid test data conflicts

### Maintenance
1. **Regular Updates**: Keep tests updated with feature changes
2. **Refactor Tests**: Refactor tests when code changes
3. **Monitor Coverage**: Maintain target coverage levels
4. **Review Failures**: Investigate and fix failing tests promptly

## Troubleshooting

### Common Issues

**Tests failing due to async operations**
- Ensure proper async/await usage
- Add appropriate timeouts for async operations

**Mock not working correctly**
- Verify mock setup in jest.setup.js
- Check mock implementation matches actual API

**Coverage not meeting targets**
- Identify uncovered code paths
- Add tests for missing scenarios
- Review coverage report for gaps

### Debug Mode
Run tests in debug mode for troubleshooting:
```bash
npm run test -- --verbose --detectOpenHandles
```

## Contributing

When adding new features:
1. Write unit tests for new functions
2. Add integration tests for new workflows
3. Update test scenarios for new user interactions
4. Maintain test documentation
5. Ensure coverage targets are met

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/)
- [Next.js Testing](https://nextjs.org/docs/testing)
- [Supabase Testing](https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs#testing)