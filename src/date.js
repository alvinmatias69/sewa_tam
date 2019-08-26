function calculateDuration(start, end) {
    return Math.floor(
        (Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()) -
         Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())) /
            (1000 * 60 * 60 * 24));
}

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function formatDate(date) {
    const d = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${d}-${month}-${year}`;
}
