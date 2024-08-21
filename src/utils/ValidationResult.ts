export class ValidationResult {
  public is_valid: boolean;
  public error_message?: string;

  constructor(is_valid: boolean, error_message?: string) {
    this.is_valid = is_valid;
    this.error_message = error_message;
  }
}
