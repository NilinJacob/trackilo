type ApiResponse<T> = {
  statusCode: number;
  success: boolean;
  message: string;
  data: T;
};

export const apiResponse = <T>(
  statusCode: number,
  message = "success",
  data: T,
): ApiResponse<T> => {
  return {
    statusCode,
    success: statusCode < 400,
    message,
    data,
  };
};
