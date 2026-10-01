"""Exception chuẩn hóa từ adapter provider."""


class ProviderError(Exception):
    """Lỗi chung từ nhà cung cấp bên ngoài."""


class ProviderRateLimited(ProviderError):
    pass


class ProviderUnavailable(ProviderError):
    pass


class ProviderAuthError(ProviderError):
    pass


class ProviderQuotaExceeded(ProviderError):
    pass


class ProviderSchemaError(ProviderError):
    pass


class ProviderNotConfigured(ProviderError):
    pass
