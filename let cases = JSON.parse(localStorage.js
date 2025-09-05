let cases = JSON.parse(localStorage.getItem('labCases')) || [];
const caseForm = document.getElementById('caseForm');
const caseTableBody = document.getElementById('caseTableBody');
const searchInput = document.getElementById('search');
const totalCasesEl = document.getElementById('totalCases');
const completedCasesEl = document.getElementById('completedCases');
const inProgressCasesEl = document.getElementById('inProgressCases');
const delayedCasesEl = document.getElementById('delayedCases');
const filterStatus = document.getElementById('filterStatus');
const filterToothColor = document.getElementById('filterToothColor');
const filterDoctor = document.getElementById('filterDoctor');
let barChart, pieChart;

function saveToStorage(){ localStorage.setItem('labCases', JSON.stringify(cases)); }

function renderDashboard(){
    const statusCount = { "قيد التنفيذ":0, "مكتمل":0, "مؤجل":0 };
    cases.forEach(c => statusCount[c.caseStatus]++);
    totalCasesEl.textContent = cases.length;
    completedCasesEl.textContent = statusCount["مكتمل"];
    inProgressCasesEl.textContent = statusCount["قيد التنفيذ"];
    delayedCasesEl.textContent = statusCount["مؤجل"];

    const barData = {
        labels:["قيد التنفيذ","مكتمل","مؤجل"],
        datasets:[{label:'عدد الحالات', data:[statusCount["قيد التنفيذ"],statusCount["مكتمل"],statusCount["مؤجل"]], backgroundColor:['orange','green','red']}]
    };
    if(barChart){ barChart.destroy(); }
    barChart = new Chart(document.getElementById('statusBarChart'), { type:'bar', data:barData, options:{ responsive:true, plugins:{legend:{display:false}} } });

    const pieData = {
        labels:["قيد التنفيذ","مكتمل","مؤجل"],
        datasets:[{data:[statusCount["قيد التنفيذ"],statusCount["مكتمل"],statusCount["مؤجل"]], backgroundColor:['orange','green','red']}]
    };
    if(pieChart){ pieChart.destroy(); }
    pieChart = new Chart(document.getElementById('statusPieChart'), { type:'pie', data:pieData, options:{ responsive:true } });
}

function deleteCase(index){ if(confirm('هل أنت متأكد من حذف هذه الحالة؟')){ cases.splice(index,1); saveToStorage(); applyFilters(); } }
function editCase(index){
    const c = cases[index];
    document.getElementById('patientName').value = c.patientName;
    document.getElementById('patientCode').value = c.patientCode;
    document.getElementById('doctorName').value = c.doctorName;
    document.getElementById('caseStatus').value = c.caseStatus;
    document.getElementById('toothColor').value = c.toothColor;
    document.getElementById('receiveDate').value = c.receiveDate;
    document.getElementById('deliveryDate').value = c.deliveryDate;
    document.getElementById('notes').value = c.notes;
    deleteCase(index);
}

caseForm.addEventListener('submit', function(e){
    e.preventDefault();
    const newCase = {
        patientName: document.getElementById('patientName').value,
        patientCode: document.getElementById('patientCode').value,
        doctorName: document.getElementById('doctorName').value,
        caseStatus: document.getElementById('caseStatus').value,
        toothColor: document.getElementById('toothColor').value,
        receiveDate: document.getElementById('receiveDate').value,
        deliveryDate: document.getElementById('deliveryDate').value,
        notes: document.getElementById('notes').value
    };
    cases.push(newCase);
    saveToStorage();
    caseForm.reset();
    applyFilters();
});

document.getElementById('exportExcel').addEventListener('click', function(){
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(cases);
    XLSX.utils.book_append_sheet(wb, ws, "Cases");
    XLSX.writeFile(wb, "cases.xlsx");
});

document.getElementById('exportPDF').addEventListener('click', function(){
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let y = 10;
    doc.setFontSize(14);
    doc.text("قائمة الحالات - Magnetic Lab",105,y,{align:"center"});
    y+=10;
    cases.forEach(c => { 
        doc.text(`كود:${c.patientCode} | اسم:${c.patientName} | طبيب:${c.doctorName} | لون الأسنان:${c.toothColor} | حالة:${c.caseStatus} | استلام:${c.receiveDate} | تسليم:${c.deliveryDate} | ملاحظات:${c.notes || '-'}`,10,y); 
        y+=10; 
    });
    doc.save("cases.pdf");
});

function addCaseFromRow(index){
    const c = cases[index];
    const newCase = {...c};
    cases.push(newCase);
    saveToStorage();
    applyFilters();
}

function printCase(index){
    const c = cases[index];
    const printWindow = window.open('', '', 'height=400,width=600');
    printWindow.document.write('<html><head><title>طباعة الحالة</title></head><body>');
    printWindow.document.write(`<h2>حالة المريض - Magnetic Lab</h2>`);
    printWindow.document.write(`<p><strong>كود المريض:</strong> ${c.patientCode}</p>`);
    printWindow.document.write(`<p><strong>اسم المريض:</strong> ${c.patientName}</p>`);
    printWindow.document.write(`<p><strong>الطبيب:</strong> ${c.doctorName}</p>`);
    printWindow.document.write(`<p><strong>لون الأسنان:</strong> ${c.toothColor}</p>`);
    printWindow.document.write(`<p><strong>الحالة:</strong> ${c.caseStatus}</p>`);
    printWindow.document.write(`<p><strong>موعد الاستلام:</strong> ${c.receiveDate}</p>`);
    printWindow.document.write(`<p><strong>موعد التسليم:</strong> ${c.deliveryDate}</p>`);
    printWindow.document.write(`<p><strong>الملاحظات:</strong> ${c.notes || '-'}</p>`);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
}

function applyFilters(){
    const status = filterStatus.value;
    const color = filterToothColor.value;
    const doctor = filterDoctor.value.trim();
    const searchTerm = searchInput.value.trim();

    caseTableBody.innerHTML='';

    const filtered = cases.filter(c => {
        const matchesSearch = c.patientName.includes(searchTerm) || 
                              c.patientCode.includes(searchTerm) || 
                              c.doctorName.includes(searchTerm) || 
                              c.toothColor.includes(searchTerm) || 
                              (c.notes && c.notes.includes(searchTerm));

        const matchesStatus = status ? c.caseStatus === status : true;
        const matchesColor = color ? c.toothColor === color : true;
        const matchesDoctor = doctor ? c.doctorName.includes(doctor) : true;

        return matchesSearch && matchesStatus && matchesColor && matchesDoctor;
    });

    filtered.forEach((c,index)=>{
        let statusClass = c.caseStatus==='قيد التنفيذ'?'status-qid':c.caseStatus==='مكتمل'?'status-makt':'status-moaj';
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${c.patientCode}</td>
            <td>${c.patientName}</td>
            <td>${c.doctorName}</td>
            <td>${c.toothColor}</td>
            <td class="${statusClass}">${c.caseStatus}</td>
            <td>${c.receiveDate}</td>
            <td>${c.deliveryDate}</td>
            <td>${c.notes || ''}</td>
            <td class="actions">
                <button class="edit" onclick="editCase(${index})">تعديل</button>
                <button class="delete" onclick="deleteCase(${index})">حذف</button>
                <button class="add" onclick="addCaseFromRow(${index})">إضافة</button>
                <button class="print" onclick="printCase(${index})">طباعة</button>
            </td>
        `;
        caseTableBody.appendChild(row);
    });

    renderDashboard();
}

filterStatus.addEventListener('change', applyFilters);
filterToothColor.addEventListener('change', applyFilters);
filterDoctor.addEventListener('input', applyFilters);
searchInput.addEventListener('input', applyFilters);

applyFilters();
