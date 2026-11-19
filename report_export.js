/* =========================================================
   ATTENDANCE REPORT EXPORT (PDF & EXCEL)
   ========================================================= */

// danata filter karala thiyena data tika witharak gannawa
function getFilteredAttendanceData() {
    const timeFilter = document.getElementById('filter-time') ? document.getElementById('filter-time').value : 'all';
    const personFilter = document.getElementById('filter-person') ? document.getElementById('filter-person').value.toLowerCase().trim() : '';
    const eventFilter = document.getElementById('filter-event') ? document.getElementById('filter-event').value : '';

    const now = new Date();
    const sourceData = typeof globalRegistrationsData !== 'undefined' ? globalRegistrationsData : [];

    return sourceData.filter(row => {
        if (row.created_at) {
            const rowDate = new Date(row.created_at);
            if (timeFilter === 'today') {
                if (rowDate.toDateString() !== now.toDateString()) return false;
            } else if (timeFilter === 'week') {
                const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                if (rowDate < oneWeekAgo) return false;
            } else if (timeFilter === 'month') {
                if (rowDate.getMonth() !== now.getMonth() || rowDate.getFullYear() !== now.getFullYear()) return false;
            } else if (timeFilter === '3months') {
                const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
                if (rowDate < threeMonthsAgo) return false;
            } else if (timeFilter === 'year') {
                if (rowDate.getFullYear() !== now.getFullYear()) return false;
            }
        } else if (timeFilter !== 'all') {
            return false;
        }

        if (personFilter) {
            const createdBy = (row.created_by || '').toLowerCase();
            const checkedBy = (row.checked_by || '').toLowerCase();
            if (!createdBy.includes(personFilter) && !checkedBy.includes(personFilter)) {
                return false;
            }
        }

        if (eventFilter && row.event_title !== eventFilter) {
            return false;
        }

        return true;
    });
}

// report eke uda danna filter wisthara tika hadanawa
function getAppliedFilterSummary() {
    const timeSelect = document.getElementById('filter-time');
    const timeText = timeSelect ? timeSelect.options[timeSelect.selectedIndex].text : 'All Time';
    const personInput = document.getElementById('filter-person');
    const personText = personInput && personInput.value.trim() !== '' ? personInput.value.trim() : 'All';
    const eventSelect = document.getElementById('filter-event');
    const eventText = eventSelect && eventSelect.value !== '' ? eventSelect.value : 'All Events';
    const isAdmin = document.getElementById('admin-extra-filters') !== null;

    if (isAdmin) {
        return `Time Period: ${timeText}  |  Person/ID: ${personText}  |  Event: ${eventText}`;
    } else {
        return `Time Period: ${timeText}`;
    }
}

// pdf report eka hadala download karanawa
function exportAttendancePDF() {
    const filteredData = getFilteredAttendanceData();
    if (filteredData.length === 0) {
        alert('Download karanna tabale eke data na ban!');
        return;
    }

    const { jsPDF } = window.jspdf;
    const isAdmin = document.getElementById('admin-extra-filters') !== null;
    const doc = new jsPDF({ orientation: isAdmin ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();

    // pdf eke uda nil pata banner eka
    doc.setFillColor(30, 58, 138);
    doc.rect(0, 0, pageWidth, 24, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('EVENT MANAGEMENT SYSTEM - ATTENDANCE REPORT', 14, 15);

    doc.setTextColor(50, 50, 50);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const generatedDate = new Date().toLocaleString();
    const roleLabel = isAdmin ? 'Administrator Report' : `User Report (ID: ${localStorage.getItem('loggedInUserId') || 'N/A'})`;

    doc.text(`Report Type: ${roleLabel}`, 14, 32);
    doc.text(`Generated On: ${generatedDate}`, pageWidth - 14, 32, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.text(`Applied Filters: ${getAppliedFilterSummary()}`, 14, 38);

    const totalReg = filteredData.length;
    const checkedIn = filteredData.filter(r => r.status === 'Checked-In').length;
    const pending = totalReg - checkedIn;

    // mulu ganana pennana box eka
    doc.setFillColor(243, 244, 246);
    doc.rect(14, 42, pageWidth - 28, 10, 'F');
    doc.setTextColor(0, 0, 0);
    doc.text(`Total Registered: ${totalReg}      |      Checked-In: ${checkedIn}      |      Pending: ${pending}`, 18, 48.5);

    let headers = [];
    let bodyRows = [];

    // admin ta saha user ta wenama table columns hadanawa
    if (isAdmin) {
        headers = [['Ticket', 'Name', 'NIC', 'Event', 'Created By', 'Checked By', 'Status', 'Registered Time']];
        bodyRows = filteredData.map(row => [
            row.ticket_code || '-', row.full_name || '-', row.nic || '-', row.event_title || '-',
            row.created_by || '-', row.checked_by ? `${row.checked_by} (${row.checked_by_role || ''})` : '-',
            row.status || 'Pending', row.created_at ? new Date(row.created_at).toLocaleString() : 'N/A'
        ]);
    } else {
        headers = [['Ticket', 'Name', 'NIC', 'Event', 'Status', 'Registered Time']];
        bodyRows = filteredData.map(row => [
            row.ticket_code || '-', row.full_name || '-', row.nic || '-', row.event_title || '-',
            row.status || 'Pending', row.created_at ? new Date(row.created_at).toLocaleString() : 'N/A'
        ]);
    }

    // autoTable eken pdf eke table eka adinawa
    doc.autoTable({
        startY: 56,
        head: headers,
        body: bodyRows,
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 8.5, textColor: 40 },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        margin: { left: 14, right: 14 }
    });

    const dateStr = new Date().toISOString().slice(0, 10);
    doc.save(isAdmin ? `Admin_Attendance_Report_${dateStr}.pdf` : `My_Attendance_Report_${dateStr}.pdf`);
}

// excel report eka hadala download karanawa
function exportAttendanceExcel() {
    const filteredData = getFilteredAttendanceData();
    if (filteredData.length === 0) {
        alert('Download karanna tabale eke data na ban!');
        return;
    }

    const isAdmin = document.getElementById('admin-extra-filters') !== null;
    const totalReg = filteredData.length;
    const checkedIn = filteredData.filter(r => r.status === 'Checked-In').length;
    const pending = totalReg - checkedIn;

    // excel sheet eke mul peli tika
    const sheetData = [
        ['EVENT MANAGEMENT SYSTEM - ATTENDANCE REPORT'],
        ['Report Type:', isAdmin ? 'Administrator Report' : `User Report (${localStorage.getItem('loggedInUserId') || 'N/A'})`],
        ['Generated On:', new Date().toLocaleString()],
        ['Applied Filters:', getAppliedFilterSummary()],
        ['Summary:', `Total Registered: ${totalReg} | Checked-In: ${checkedIn} | Pending: ${pending}`],
        []
    ];

    if (isAdmin) {
        sheetData.push(['Ticket Code', 'Full Name', 'NIC Number', 'Event Title', 'Created By', 'Checked By', 'Checker Role', 'Status', 'Registered Time']);
        filteredData.forEach(row => {
            sheetData.push([
                row.ticket_code || '-', row.full_name || '-', row.nic || '-', row.event_title || '-',
                row.created_by || '-', row.checked_by || '-', row.checked_by_role || '-',
                row.status || 'Pending', row.created_at ? new Date(row.created_at).toLocaleString() : 'N/A'
            ]);
        });
    } else {
        sheetData.push(['Ticket Code', 'Full Name', 'NIC Number', 'Event Title', 'Status', 'Registered Time']);
        filteredData.forEach(row => {
            sheetData.push([
                row.ticket_code || '-', row.full_name || '-', row.nic || '-', row.event_title || '-',
                row.status || 'Pending', row.created_at ? new Date(row.created_at).toLocaleString() : 'N/A'
            ]);
        });
    }

    // excel file eka hadala save karanawa
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Report');

    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, isAdmin ? `Admin_Attendance_Report_${dateStr}.xlsx` : `My_Attendance_Report_${dateStr}.xlsx`);
}