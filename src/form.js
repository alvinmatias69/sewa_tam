const fs = require("fs");
const Papa = require("papaparse");

function onFormSubmit() {
    const finalDate = getDate();
    const csv = getCSV();

    const calculation = new Calculation(finalDate, csv);
    const result = calculation.calculate();

    const csvResult = parseToCSV(result);
    showDownload(csvResult);

    return false;
}

function getDate() {
    const dateEl = document.getElementById("final_date");
    return new Date(dateEl.value);
}

function getCSV() {
    const fileEl = document.getElementById("csv_data");
    const path = fileEl.files[0].path;
    let contents = fs.readFileSync(path, "utf8");
    contents = parseCSV(contents);
    contents = sortCSV(contents.data);

    return contents;
}

function parseCSV(csv) {
    return Papa.parse(csv, {
        header: true,
        transform: (item, key) => {
            let result = item.trim();

            if (key === "tanggal") {
                result = new Date(result);
            } else if (key === "kirim" || key === "rusak" || key === "masuk") {
                result = parseInt(result.replace(",", "").replace(".", ""), 10) || null;
            }

            return result;
        },
        skipEmptyLines: true,
    });
}

function sortCSV(csv) {
    return csv.sort((a, b) => {
        if(a.nama < b.nama) { return -1; }
        if(a.nama > b.nama) { return 1; }
        return a.tanggal - b.tanggal;
    });
}

function parseToCSV(data) {
    return Papa.unparse(data);
}

function showDownload(data) {
    const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });

    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "result.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
