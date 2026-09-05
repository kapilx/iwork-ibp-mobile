export function extractValidationErrors(errors: any[]) {
  const result: any[] = [];
  for (const error of errors) {
    if (error.constraints) {
      result.push({
        property: error.property,
        constraints: error.constraints,
      });
    }
    if (error.children && error.children.length > 0) {
      const childErrors = extractValidationErrors(error.children);
      for (const childError of childErrors) {
        result.push({
          property: `${error.property}.${childError.property}`,
          constraints: childError.constraints,
        });
      }
    }
  }
  return result;
}