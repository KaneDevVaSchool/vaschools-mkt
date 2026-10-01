export function formatRelativeTime(iso: string): string {
    const then = new Date(iso).getTime();
    const diffMs = Date.now() - then;
    if (Number.isNaN(then)) return "";

    const sec = Math.floor(diffMs / 1000);
    if (sec < 60) return "Vừa xong";
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min} phút trước`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr} giờ trước`;
    const day = Math.floor(hr / 24);
    if (day < 7) return `${day} ngày trước`;
    return new Date(iso).toLocaleDateString("vi-VN");
}
