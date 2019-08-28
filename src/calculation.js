const TYPE = {
    GOT: "masuk",
    BROKE: "rusak"
};

class Calculation {
    constructor(finalDate, csv) {
        this.finalDate = finalDate;
        this.csv = csv;
        this.queue = [];
        this.currentName = "";
    }

    calculate() {
        const result = this.csv.reduce((total, current) => {
            let result = [...total];
            if (this.currentName !== current.nama) {
                result.push(...this.dequeue());
                this.cleanup(current.nama);
            }

            if (current.kirim !== null) {
                this.queue.push(current);
            } else {
                result.push(...this.countDuration(current, TYPE.BROKE));
                result.push(...this.countDuration(current, TYPE.GOT));
            }

            return result;
        }, []);

        return result;
    }

    dequeue() {
        const result = this.queue.map(current => {
            const item = {
                name: current.nama,
                tanggal_kirim: formatDate(current.tanggal),
                tanggal_masuk: formatDate(this.finalDate),
                durasi: calculateDuration(current.tanggal, this.finalDate),
                surat_jalan_kirim: current.sj,
                surat_jalan_masuk: "",
                jumlah: current.kirim,
                rusak: "",
            };

            return item;
        });

        return result;
    }

    cleanup(name) {
        this.queue = [];
        this.currentName = name;
    }

    countDuration(data, type) {
        if (data[type] === null) {
            return [];
        }

        let count = data[type];
        let result = [];

        while (count > 0) {
            result.push(this.createRecordItem(data, type, count));

            if (count < this.queue[0].kirim) {
                this.queue[0].kirim = this.queue[0].kirim - count;
                count = 0;
            } else {
                count -= this.queue[0].kirim;
                this.queue.shift();
            }
        }

        return result;
    }

    createRecordItem(data, type, current) {
        const currentQueue = this.queue[0];

        if (currentQueue === undefined) {
            throw `Barang "${data.nama}" yang masuk / rusak melebihi barang yang dikirim.`;
        }

        const item = {
            name: data.nama,
            tanggal_kirim: formatDate(currentQueue.tanggal),
            tanggal_masuk: formatDate(data.tanggal),
            durasi: calculateDuration(currentQueue.tanggal, data.tanggal),
            surat_jalan_kirim: currentQueue.sj,
            surat_jalan_masuk: data.sj,
            jumlah: "",
            rusak: "",
        };
        let diff = current > currentQueue.kirim ? currentQueue.kirim : current;
        item[type == TYPE.GOT ? "jumlah" : type] = diff;

        return item;
    }
}
