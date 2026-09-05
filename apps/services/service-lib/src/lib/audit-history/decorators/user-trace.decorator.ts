import { SetMetadata } from '@nestjs/common';

export const USER_TRACE_KEY = 'userTraceAction';

export function UserTrace(action: string): MethodDecorator {
  return SetMetadata(USER_TRACE_KEY, action);
}
