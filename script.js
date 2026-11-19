/* =========================================================
   SUPABASE CONFIGURATION & SHARED HELPERS
   ========================================================= */
// supabase database eke url eka saha key eka
const SUPABASE_URL = 'https://kozekorgqqegvwjiajok.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_PWTpzCXvPk2US7hU3WrKEw_r39tBJxP';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let html5QrCode = null;
let globalRegistrationsData = [];

// system eken logout wenna
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('loggedInUserId');
        localStorage.removeItem('loggedInRole');
        window.location.replace('index.html');
    }
}

// html tags awl wena eka nawaththanna
function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
}

// form yatin message eka pennanna
function showMessage(id, message, success) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = message;
    el.className = success
        ? 'mt-4 p-3 rounded-lg bg-green-100 text-green-800'
        : 'mt-4 p-3 rounded-lg bg-yellow-100 text-yellow-800';
}

/* =========================================================
   1. LOGIN PAGE LOGIC
   ========================================================= */
if (document.getElementById('loginForm')) {
    const passwordInput = document.getElementById('password');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const eyeIcon = document.getElementById('eyeIcon');
    const eyeOffIcon = document.getElementById('eyeOffIcon');

    // password eka penna saha hanganna
    togglePasswordBtn.addEventListener('click', function () {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        eyeIcon.classList.toggle('hidden');
        eyeOffIcon.classList.toggle('hidden');
    });

    // login button ebuwama check karana kotasa
    document.getElementById('loginForm').addEventListener('submit', async function (event) {
        event.preventDefault();

        const emailOrId = document.getElementById('emailOrId').value.trim();
        const password = passwordInput.value;
        const errorMessage = document.getElementById('errorMessage');
        const loginBtn = document.getElementById('loginBtn');

        errorMessage.classList.add('hidden');
        errorMessage.textContent = '';

        if (!emailOrId || !password) {
            errorMessage.textContent = 'Please fill in all fields.';
            errorMessage.classList.remove('hidden');
            return;
        }

        loginBtn.disabled = true;
        loginBtn.textContent = 'Logging in...';

        try {
            // mulinma admin table eke innawada balanawa
            const { data: adminData, error: adminError } = await supabaseClient
                .from('admins')
                .select('*')
                .or(`admin_id.eq.${emailOrId},email.eq.${emailOrId}`)
                .eq('password', password);

            if (adminError) throw adminError;
            if (adminData && adminData.length > 0) {
                localStorage.setItem('loggedInUserId', adminData[0].admin_id);
                localStorage.setItem('loggedInRole', 'ADMIN');
                window.location.replace('admin_dashboard.html');
                return;
            }

            // admin neme nam users table eke innawada balanawa
            const { data: userData, error: userError } = await supabaseClient
                .from('users')
                .select('*')
                .or(`user_id.eq.${emailOrId},email.eq.${emailOrId}`)
                .eq('password', password);

            if (userError) throw userError;
            if (userData && userData.length > 0) {
                localStorage.setItem('loggedInUserId', userData[0].user_id);
                localStorage.setItem('loggedInRole', 'USER');
                window.location.replace('user_dashboard.html');
                return;
            }

            // denna athare nathnam waradi kiyala pennanawa
            errorMessage.textContent = 'Invalid Email/ID or Password. Please try again.';
            errorMessage.classList.remove('hidden');

        } catch (error) {
            console.error('Login Error:', error);
            errorMessage.textContent = 'An error occurred during login. Please check your connection.';
            errorMessage.classList.remove('hidden');
        } finally {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Login';
        }
    });
}

/* =========================================================
   2. SHARED QR CODE, PDF & CHECK-IN LOGIC
   ========================================================= */
// ticket code ekata adala qr image eka hadanawa
function generateQRCodeDataURL(text) {
    const qr = qrcode(0, 'M');
    qr.addData(text);
    qr.make();
    const moduleCount = qr.getModuleCount();
    const canvas = document.createElement('canvas');
    const size = 200;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const tileSize = size / moduleCount;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#000000';
    for (let row = 0; row < moduleCount; row++) {
        for (let col = 0; col < moduleCount; col++) {
            if (qr.isDark(row, col)) {
                ctx.fillRect(col * tileSize, row * tileSize, tileSize, tileSize);
            }
        }
    }
    return canvas.toDataURL('image/png');
}

// register unama ticket pdf eka hadala download karanawa
function downloadTicketPDF(ticketData) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFillColor(37, 99, 235);
    doc.rect(15, 15, 180, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('EVENT MANAGEMENT SYSTEM', 105, 30, { align: 'center' });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text('OFFICIAL ENTRY TICKET', 105, 55, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    let startY = 70;
    doc.text('Ticket Code :', 25, startY);
    doc.setFont('helvetica', 'bold');
    doc.text(`${ticketData.ticket_code}`, 70, startY);

    doc.setFont('helvetica', 'normal');
    doc.text('Event Title :', 25, startY + 12);
    doc.setFont('helvetica', 'bold');
    doc.text(`${ticketData.event_title}`, 70, startY + 12);

    doc.setFont('helvetica', 'normal');
    doc.text('Attendee Name :', 25, startY + 24);
    doc.setFont('helvetica', 'bold');
    doc.text(`${ticketData.full_name}`, 70, startY + 24);

    doc.setFont('helvetica', 'normal');
    doc.text('NIC Number :', 25, startY + 36);
    doc.setFont('helvetica', 'bold');
    doc.text(`${ticketData.nic}`, 70, startY + 36);

    doc.setFont('helvetica', 'normal');
    doc.text('Email Address :', 25, startY + 48);
    doc.setFont('helvetica', 'bold');
    doc.text(`${ticketData.email}`, 70, startY + 48);

    // qr code eka pdf ekata danawa
    try {
        const qrDataURL = generateQRCodeDataURL(ticketData.ticket_code);
        doc.addImage(qrDataURL, 'PNG', 135, startY, 50, 50);
    } catch (e) {
        console.error('QR Code generation failed', e);
    }

    doc.setLineWidth(0.5);
    doc.line(25, startY + 65, 185, startY + 65);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Please present this ticket and QR code at the entrance check-in counter.', 105, startY + 75, { align: 'center' });
    doc.save(`Ticket_${ticketData.ticket_code}.pdf`);
}

// qr scan karanna camera eka on karanawa
function startQRScanner() {
    const readerDiv = document.getElementById('qr-reader');
    const stopBtn = document.getElementById('stopCameraBtn');
    readerDiv.style.display = 'block';
    stopBtn.classList.remove('hidden');

    html5QrCode = new Html5Qrcode('qr-reader');
    html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
            const ticketInput = document.getElementById('checkin-ticket') || document.getElementById('checkinTicket');
            if (ticketInput) ticketInput.value = decodedText;
            stopQRScanner();
            verifyAndCheckIn(decodedText, '');
        },
        () => {}
    ).catch(err => {
        alert(`Camera error: ${err}`);
    });
}

// camera eka off karanna
function stopQRScanner() {
    if (html5QrCode) {
        html5QrCode.stop().then(() => {
            html5QrCode.clear();
            const reader = document.getElementById('qr-reader');
            const stopBtn = document.getElementById('stopCameraBtn');
            if (reader) reader.style.display = 'none';
            if (stopBtn) stopBtn.classList.add('hidden');
        }).catch(err => {
            console.error('Failed to stop scanner.', err);
        });
    }
}

// ticket eka check karala database eke status eka Checked-In karanawa
async function verifyAndCheckIn(ticketInput, nicInput) {
    const statusBox = document.getElementById('checkin-status') || document.getElementById('status-box');
    const checkinBtn = document.getElementById('checkinBtn');

    if (!ticketInput && !nicInput) {
        statusBox.textContent = 'Please enter either Ticket Code or NIC Number!';
        statusBox.className = 'mt-5 p-4 bg-red-100 rounded-lg text-red-800 text-center font-medium';
        return;
    }

    checkinBtn.disabled = true;
    checkinBtn.textContent = 'Verifying...';

    try {
        let query = supabaseClient.from('registrations').select('*');

        if (ticketInput && nicInput) {
            query = query.eq('ticket_code', ticketInput).eq('nic', nicInput);
        } else if (ticketInput) {
            query = query.eq('ticket_code', ticketInput);
        } else {
            query = query.eq('nic', nicInput);
        }

        const { data, error } = await query.maybeSingle();
        if (error) throw error;

        if (!data) {
            statusBox.textContent = 'No matching attendee found with the provided details!';
            statusBox.className = 'mt-5 p-4 bg-red-100 rounded-lg text-red-800 text-center font-medium';
        } else if (data.status === 'Checked-In') {
            statusBox.innerHTML = `<b>Warning:</b> Attendee <b>${escapeHtml(data.full_name)}</b> (NIC: ${escapeHtml(data.nic)}) is already Checked-In!`;
            statusBox.className = 'mt-5 p-4 bg-yellow-100 rounded-lg text-yellow-800 text-center font-medium';
        } else {
            const checkerId = localStorage.getItem('loggedInUserId') || 'Unknown';
            const checkerRole = localStorage.getItem('loggedInRole') || 'USER';

            const { error: updateError } = await supabaseClient
                .from('registrations')
                .update({ 
                    status: 'Checked-In',
                    checked_by: checkerId,
                    checked_by_role: checkerRole,
                    checked_in_at: new Date().toISOString()
                })
                .eq('registration_id', data.registration_id);

            if (updateError) throw updateError;

            statusBox.innerHTML = `<b>Verified & Checked-In Successfully!</b><br>
                Name: <b>${escapeHtml(data.full_name)}</b><br>
                NIC: <b>${escapeHtml(data.nic)}</b><br>
                Event: <b>${escapeHtml(data.event_title)}</b>`;
            statusBox.className = 'mt-5 p-4 bg-green-100 rounded-lg text-green-800 text-center font-medium';

            // check unata passe input box tika clear karanawa
            const t1 = document.getElementById('checkin-ticket');
            const n1 = document.getElementById('checkin-nic');
            const t2 = document.getElementById('checkinTicket');
            const n2 = document.getElementById('checkinNic');
            if (t1) t1.value = '';
            if (n1) n1.value = '';
            if (t2) t2.value = '';
            if (n2) n2.value = '';
        }
    } catch (err) {
        console.error(err);
        statusBox.textContent = `Check-in error: ${err.message}`;
        statusBox.className = 'mt-5 p-4 bg-red-100 rounded-lg text-red-800 text-center font-medium';
    } finally {
        checkinBtn.disabled = false;
        checkinBtn.textContent = 'Verify & Check-In';
    }
}

/* =========================================================
   3. TIME & EXTRA FILTERS LOGIC
   ========================================================= */
// attendance table eke data filter karanna
function applyFilters() {
    const timeFilter = document.getElementById('filter-time') ? document.getElementById('filter-time').value : 'all';
    const personFilter = document.getElementById('filter-person') ? document.getElementById('filter-person').value.toLowerCase().trim() : '';
    const eventFilter = document.getElementById('filter-event') ? document.getElementById('filter-event').value : '';

    const now = new Date();

    const filtered = globalRegistrationsData.filter(row => {
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

    renderAttendanceTable(filtered);
}

// filter karapu data tika table ekata danawa
function renderAttendanceTable(data) {
    const tbody = document.getElementById('attendance-table') || document.getElementById('attendanceTable');
    if (!tbody) return;

    const totalReg = data.length;
    const checkedInCount = data.filter(r => r.status === 'Checked-In').length;
    const pendingCount = totalReg - checkedInCount;

    if (document.getElementById('total-registered')) document.getElementById('total-registered').textContent = totalReg;
    if (document.getElementById('total-checkedin')) document.getElementById('total-checkedin').textContent = checkedInCount;
    if (document.getElementById('total-pending')) document.getElementById('total-pending').textContent = pendingCount;

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center p-4 text-gray-500">Data mukuth na me velave.. vasse varen..!</td></tr>';
        return;
    }

    const isAdmin = document.getElementById('admin-extra-filters') !== null;

    tbody.innerHTML = data.map(row => {
        const regTime = row.created_at ? new Date(row.created_at).toLocaleString() : 'N/A';
        const statusBadge = row.status === 'Checked-In'
            ? '<span class="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-bold">Checked-In</span>'
            : '<span class="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-bold">Pending</span>';

        let checkedByDisplay = '-';
        if (row.checked_by) {
            const roleBadge = row.checked_by_role === 'ADMIN' 
                ? '<span class="text-xs bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-bold ml-1">Admin</span>' 
                : '<span class="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold ml-1">User</span>';
            checkedByDisplay = `${escapeHtml(row.checked_by)} ${roleBadge}`;
        }

        const createdByDisplay = row.created_by ? escapeHtml(row.created_by) : '-';

        return `<tr class="border-t hover:bg-gray-50">
            <td class="p-3 font-mono text-xs">${escapeHtml(row.ticket_code)}</td>
            <td class="p-3">${escapeHtml(row.full_name)}</td>
            <td class="p-3">${escapeHtml(row.nic)}</td>
            <td class="p-3">${escapeHtml(row.event_title)}</td>
            ${isAdmin ? `<td class="p-3 text-xs">${createdByDisplay}</td><td class="p-3 text-xs">${checkedByDisplay}</td>` : ''}
            <td class="p-3">${statusBadge}</td>
            <td class="p-3 text-xs text-gray-500">${escapeHtml(regTime)}</td>
        </tr>`;
    }).join('');
}

// dapu filters ain karala mul idan pennanna
function resetFilters() {
    if (document.getElementById('filter-time')) document.getElementById('filter-time').value = 'all';
    if (document.getElementById('filter-person')) document.getElementById('filter-person').value = '';
    if (document.getElementById('filter-event')) document.getElementById('filter-event').value = '';
    renderAttendanceTable(globalRegistrationsData);
}

/* =========================================================
   4. ADMIN DASHBOARD SPECIFIC LOGIC
   ========================================================= */
const isAdminPage = document.getElementById('confirm-modal') !== null;

let currentAccountType = 'users';
let editingUserId = null;
let editingVenueId = null;
let editingEventId = null;

// admin page eke tab maru karanna
function showPage(pageName) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('page-' + pageName).classList.add('active');
    document.getElementById('btn-' + pageName).classList.add('active');

    if (pageName !== 'checkin') stopQRScanner();
    if (pageName === 'accounts') loadAccounts(currentAccountType);
    if (pageName === 'venues') loadVenues();
    if (pageName === 'events') { loadVenuesOptions(); loadEvents(); }
    if (pageName === 'register') loadRegEventDropdown();
    if (pageName === 'attendance') loadAttendance();
}

// delete karanna kalin ahanawa confirm modal eka
function showConfirm(message, title = 'Please confirm', confirmText = 'Confirm', danger = false) {
    return new Promise(resolve => {
        const modal = document.getElementById('confirm-modal');
        document.getElementById('confirm-title').textContent = title;
        document.getElementById('confirm-message').textContent = message;
        const accept = document.getElementById('confirm-accept');
        accept.textContent = confirmText;
        accept.className = danger
            ? 'px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700'
            : 'px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700';
        modal.hidden = false;
        const close = value => {
            modal.hidden = true;
            accept.removeEventListener('click', yes);
            document.getElementById('confirm-cancel').removeEventListener('click', no);
            modal.removeEventListener('click', outside);
            document.removeEventListener('keydown', esc);
            resolve(value);
        };
        const yes = () => close(true),
            no = () => close(false),
            outside = e => { if (e.target === modal) no(); },
            esc = e => { if (e.key === 'Escape') no(); };
        accept.addEventListener('click', yes);
        document.getElementById('confirm-cancel').addEventListener('click', no);
        modal.addEventListener('click', outside);
        document.addEventListener('keydown', esc);
    });
}

// venue form eka clear karanna
function resetVenueForm() {
    editingVenueId = null;
    document.getElementById('venueForm').reset();
    document.getElementById('venue-id').readOnly = false;
    document.getElementById('venue-save').textContent = 'Add Venue';
    document.getElementById('venue-message').textContent = '';
}

// venue ekak edit karanna form ekata gannawa
async function editVenue(encodedId) {
    const id = decodeURIComponent(encodedId);
    const { data, error } = await supabaseClient.from('venues').select('*').eq('venue_id', id).maybeSingle();
    if (error || !data) { alert(error ? `Could not load venue: ${error.message}` : 'Venue not found.'); return; }

    editingVenueId = data.venue_id;
    document.getElementById('venue-id').value = data.venue_id ?? '';
    document.getElementById('venue-id').readOnly = true;
    document.getElementById('venue-name').value = data.venue_name ?? '';
    document.getElementById('venue-capacity').value = data.capacity ?? '';
    document.getElementById('venue-save').textContent = 'Update Venue';
    showMessage('venue-message', 'Editing venue. Click "Update Venue" to save changes.', true);
    document.getElementById('venueForm').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// venue ekak delete karanna
async function deleteVenue(encodedId) {
    const id = decodeURIComponent(encodedId);
    const confirmed = await showConfirm(`Are you sure you want to delete venue "${id}"?`, 'Delete Venue', 'Delete', true);
    if (!confirmed) return;

    const { error } = await supabaseClient.from('venues').delete().eq('venue_id', id);
    if (error) { alert(`Could not delete venue: ${error.message}`); return; }

    if (String(editingVenueId) === String(id)) resetVenueForm();
    await loadVenues();
    showMessage('venue-message', 'Venue deleted successfully.', true);
}

// event form eke venue dropdown eka fill karanna
async function loadVenuesOptions() {
    const select = document.getElementById('event-venue');
    if (!select) return;
    const { data, error } = await supabaseClient.from('venues').select('venue_id, venue_name');
    if (error || !data) return;
    select.innerHTML = '<option value="">Select Venue</option>' +
        data.map(v => `<option value="${escapeHtml(v.venue_name)}">${escapeHtml(v.venue_name)}</option>`).join('');
}

// register page eke saha filter eke event dropdown tika fill karanna
async function loadRegEventDropdown() {
    const select = document.getElementById('reg-event') || document.getElementById('eventTitle');
    if (!select) return;
    const { data, error } = await supabaseClient.from('events').select('event_name');
    if (error || !data) return;
    select.innerHTML = '<option value="">Select Event</option>' +
        data.map(e => `<option value="${escapeHtml(e.event_name)}">${escapeHtml(e.event_name)}</option>`).join('');
    
    const filterEventSelect = document.getElementById('filter-event');
    if (filterEventSelect) {
        filterEventSelect.innerHTML = '<option value="">All Events</option>' +
            data.map(e => `<option value="${escapeHtml(e.event_name)}">${escapeHtml(e.event_name)}</option>`).join('');
    }
}

// event form eka clear karanna
function resetEventForm() {
    editingEventId = null;
    document.getElementById('eventForm').reset();
    document.getElementById('event-id').value = '';
    document.getElementById('event-save').textContent = 'Add Event';
    document.getElementById('event-message').textContent = '';
}

// event ekak edit karanna form ekata gannawa
async function editEvent(encodedId) {
    const id = decodeURIComponent(encodedId);
    const { data, error } = await supabaseClient.from('events').select('*').or(`event_id.eq.${id},id.eq.${id}`).maybeSingle();
    if (error || !data) { alert(error ? `Could not load event: ${error.message}` : 'Event not found.'); return; }

    editingEventId = data.event_id ?? data.id;
    document.getElementById('event-id').value = editingEventId;
    document.getElementById('event-name').value = data.event_name ?? '';
    document.getElementById('event-date').value = data.event_date ?? '';
    document.getElementById('event-venue').value = data.venue ?? '';
    document.getElementById('event-save').textContent = 'Update Event';
    showMessage('event-message', 'Editing event. Click "Update Event" to save changes.', true);
    document.getElementById('eventForm').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// event ekak delete karanna
async function deleteEvent(encodedId) {
    const id = decodeURIComponent(encodedId);
    const confirmed = await showConfirm(`Are you sure you want to delete event "${id}"?`, 'Delete Event', 'Delete', true);
    if (!confirmed) return;

    const { error } = await supabaseClient.from('events').delete().or(`event_id.eq.${id},id.eq.${id}`);
    if (error) { alert(`Could not delete event: ${error.message}`); return; }

    if (String(editingEventId) === String(id)) resetEventForm();
    await loadEvents();
    showMessage('event-message', 'Event deleted successfully.', true);
}

// admin ta okkoma attendance data database eken gannawa
async function loadAttendance() {
    const tbody = document.getElementById('attendance-table');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="7" class="text-center p-4">Loading reports...</td></tr>';

    const { data, error } = await supabaseClient
        .from('registrations')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-red-600 p-4">${escapeHtml(error.message)}</td></tr>`;
        return;
    }

    globalRegistrationsData = data || [];
    applyFilters();
}

// users saha admins panel athara maru wenna
function switchAccountType(type) {
    currentAccountType = type;
    document.getElementById('users-panel').classList.toggle('hidden', type !== 'users');
    document.getElementById('admins-panel').classList.toggle('hidden', type !== 'admins');
    document.getElementById('btn-users').className = type === 'users' ? 'bg-blue-600 text-white px-5 py-2 rounded-lg' : 'bg-gray-200 px-5 py-2 rounded-lg';
    document.getElementById('btn-admins').className = type === 'admins' ? 'bg-blue-600 text-white px-5 py-2 rounded-lg' : 'bg-gray-200 px-5 py-2 rounded-lg';
    loadAccounts(type);
}

// user aluthin hadaddi saha edit karaddi password kotu wenas karanna
function setUserFormMode(isEditing) {
    document.getElementById('password-field').classList.toggle('hidden', isEditing);
    document.getElementById('old-password-field').classList.toggle('hidden', !isEditing);
    document.getElementById('new-password-field').classList.toggle('hidden', !isEditing);
    document.getElementById('user-password').required = !isEditing;
    document.getElementById('user-old-password').required = isEditing;
    document.getElementById('user-new-password').required = false;
    document.getElementById('user-save').textContent = isEditing ? 'Update User' : 'Add User';
    document.getElementById('user-id').readOnly = isEditing;
}

// user form eka clear karanna
function resetAccountForm(role) {
    if (role !== 'users') return;
    editingUserId = null;
    document.getElementById('userForm').reset();
    document.getElementById('user-message').textContent = '';
    setUserFormMode(false);
}

// users la saha admins la table ekata load karanna
async function loadAccounts(role) {
    const tbody = document.getElementById(role === 'users' ? 'users-table' : 'admins-table');
    const idKey = role === 'users' ? 'user_id' : 'admin_id';
    const { data, error } = await supabaseClient.from(role).select('*').order(idKey, { ascending: true });
    if (error) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-red-600 p-4">${escapeHtml(error.message)}</td></tr>`;
        return;
    }
    if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center">No ${escapeHtml(role)} found.</td></tr>`;
        return;
    }
    tbody.innerHTML = data.map(row => {
        const id = role === 'users' ? row.user_id : row.admin_id;
        const safeId = encodeURIComponent(String(id ?? ''));
        if (role === 'users') {
            return `<tr>
                <td>${escapeHtml(id)}</td><td>${escapeHtml(row.name)}</td><td>${escapeHtml(row.email)}</td><td>${escapeHtml(row.phone)}</td>
                <td class="whitespace-nowrap">
                    <button type="button" class="text-blue-700 underline mr-3" onclick="editAccount('${safeId}')">Edit</button>
                    <button type="button" class="inline-flex items-center justify-center text-red-600 hover:text-red-800 p-1" onclick="deleteAccount('${safeId}')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v5M14 11v5"/></svg>
                    </button>
                </td></tr>`;
        }
        return `<tr><td>${escapeHtml(id)}</td><td>${escapeHtml(row.name)}</td><td>${escapeHtml(row.email)}</td><td>${escapeHtml(row.phone)}</td><td>View only</td></tr>`;
    }).join('');
}

// user kenek edit karanna form ekata gannawa
async function editAccount(encodedId) {
    const id = decodeURIComponent(encodedId);
    const { data, error } = await supabaseClient.from('users').select('user_id,name,email,phone').eq('user_id', id).maybeSingle();
    if (error || !data) { alert(error ? `Could not load user: ${error.message}` : 'User not found.'); return; }
    editingUserId = data.user_id;
    document.getElementById('user-id').value = data.user_id ?? '';
    document.getElementById('user-name').value = data.name ?? '';
    document.getElementById('user-email').value = data.email ?? '';
    document.getElementById('user-phone').value = data.phone ?? '';
    setUserFormMode(true);
    document.getElementById('user-name').focus();
    document.getElementById('user-message').textContent = 'Editing user. Enter the old password to confirm the update.';
    document.getElementById('userForm').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// user kenek delete karanna
async function deleteAccount(encodedId) {
    const id = decodeURIComponent(encodedId);
    const confirmed = await showConfirm(`Are you sure you want to delete user "${id}"?`, 'Delete user', 'Delete', true);
    if (!confirmed) return;
    const { error } = await supabaseClient.from('users').delete().eq('user_id', id);
    if (error) { alert(`Could not delete user: ${error.message}`); return; }
    if (String(editingUserId) === String(id)) resetAccountForm('users');
    await loadAccounts('users');
    showMessage('user-message', 'User deleted successfully.', true);
}

/* =========================================================
   5. USER PORTAL SPECIFIC LOGIC
   ========================================================= */
// user dashboard eke page maru karanna
function switchPage(pageName) {
    document.querySelectorAll('.page-content').forEach(page => page.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(button => button.classList.remove('active'));

    const selectedPage = document.getElementById('page-' + pageName);
    const selectedButton = document.getElementById('btn-' + pageName);

    if (selectedPage && selectedButton) {
        selectedPage.classList.add('active');
        selectedButton.classList.add('active');
    }

    if (pageName !== 'checkin') stopQRScanner();
    if (pageName === 'events') loadEvents();
    if (pageName === 'venues') loadVenues();
    if (pageName === 'register') loadRegEventDropdown();
    if (pageName === 'report') loadAttendanceReport();
}

// user register karapu ayage report eka witharak gannawa
async function loadAttendanceReport() {
    const tbody = document.getElementById('attendanceTable');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-gray-500">Loading reports...</td></tr>';

    const currentUserId = localStorage.getItem('loggedInUserId');
    if (!currentUserId) {
        tbody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-red-600">Session expired. Please login again.</td></tr>';
        return;
    }

    const { data, error } = await supabaseClient
        .from('registrations')
        .select('*')
        .eq('created_by', currentUserId)
        .order('created_at', { ascending: false });

    if (error) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-red-600">Error loading records: ${escapeHtml(error.message)}</td></tr>`;
        return;
    }

    globalRegistrationsData = data || [];
    applyFilters();
}

/* =========================================================
   6. SHARED DATA LOADERS (EVENTS & VENUES)
   ========================================================= */
// venues tika database eken aran table ekata danawa
async function loadVenues() {
    const adminTbody = document.getElementById('venues-table');
    const userTbody = document.getElementById('venuesTable');

    const { data, error } = await supabaseClient.from('venues').select('*').order('venue_id', { ascending: true });

    if (adminTbody) {
        if (error) {
            adminTbody.innerHTML = `<tr><td colspan="4" class="text-center text-red-600 p-4">${escapeHtml(error.message)}</td></tr>`;
            return;
        }
        if (!data || data.length === 0) {
            adminTbody.innerHTML = '<tr><td colspan="4" class="text-center">No venues found.</td></tr>';
            return;
        }
        adminTbody.innerHTML = data.map(row => {
            const safeId = encodeURIComponent(String(row.venue_id ?? ''));
            return `<tr>
                <td>${escapeHtml(row.venue_id)}</td>
                <td>${escapeHtml(row.venue_name)}</td>
                <td>${escapeHtml(row.capacity)}</td>
                <td class="whitespace-nowrap">
                    <button type="button" class="text-blue-700 underline mr-3" onclick="editVenue('${safeId}')">Edit</button>
                    <button type="button" class="inline-flex items-center justify-center text-red-600 hover:text-red-800 p-1" onclick="deleteVenue('${safeId}')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v5M14 11v5"/></svg>
                    </button>
                </td>
            </tr>`;
        }).join('');
    }

    if (userTbody) {
        if (error) { userTbody.innerHTML = '<tr><td colspan="3" class="p-4 text-center text-red-600">Error loading venues</td></tr>'; return; }
        if (!data || data.length === 0) { userTbody.innerHTML = '<tr><td colspan="3" class="p-4 text-center text-gray-500">No venues available.</td></tr>'; return; }
        userTbody.innerHTML = data.map(row => `
            <tr class="border-t hover:bg-gray-50">
                <td class="p-3">${escapeHtml(row.venue_id)}</td>
                <td class="p-3">${escapeHtml(row.venue_name)}</td>
                <td class="p-3">${escapeHtml(row.capacity)}</td>
            </tr>`).join('');
    }
}

// events tika database eken aran table ekata danawa
async function loadEvents() {
    const adminTbody = document.getElementById('events-table');
    const userTbody = document.getElementById('eventsTable');

    const { data, error } = await supabaseClient.from('events').select('*').order('created_at', { ascending: false });

    if (adminTbody) {
        if (error) {
            adminTbody.innerHTML = `<tr><td colspan="6" class="text-center text-red-600 p-4">${escapeHtml(error.message)}</td></tr>`;
            return;
        }
        if (!data || data.length === 0) {
            adminTbody.innerHTML = '<tr><td colspan="6" class="text-center">No events found.</td></tr>';
            return;
        }
        adminTbody.innerHTML = data.map(row => {
            const safeId = encodeURIComponent(String(row.event_id ?? row.id ?? ''));
            const createdDate = row.created_at ? new Date(row.created_at).toLocaleDateString() : 'N/A';
            return `<tr>
                <td>${escapeHtml(row.event_id ?? row.id)}</td>
                <td>${escapeHtml(row.event_name)}</td>
                <td>${escapeHtml(createdDate)}</td>
                <td>${escapeHtml(row.event_date)}</td>
                <td>${escapeHtml(row.venue)}</td>
                <td class="whitespace-nowrap">
                    <button type="button" class="text-blue-700 underline mr-3" onclick="editEvent('${safeId}')">Edit</button>
                    <button type="button" class="inline-flex items-center justify-center text-red-600 hover:text-red-800 p-1" onclick="deleteEvent('${safeId}')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v5M14 11v5"/></svg>
                    </button>
                </td>
            </tr>`;
        }).join('');
    }

    if (userTbody) {
        if (error) { userTbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-red-600">Error loading events</td></tr>'; return; }
        if (!data || data.length === 0) { userTbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-gray-500">No events available.</td></tr>'; return; }
        userTbody.innerHTML = data.map(row => `
            <tr class="border-t hover:bg-gray-50">
                <td class="p-3">${escapeHtml(row.event_id ?? row.id)}</td>
                <td class="p-3">${escapeHtml(row.event_name)}</td>
                <td class="p-3">${escapeHtml(new Date(row.created_at).toLocaleDateString())}</td>
                <td class="p-3">${escapeHtml(row.event_date)}</td>
                <td class="p-3">${escapeHtml(row.venue)}</td>
            </tr>`).join('');
    }
}

/* =========================================================
   7. EVENT LISTENERS & FORMS INITIALIZATION
   ========================================================= */
// attendee register karana form eka submit unama
const regForm = document.getElementById('registrationForm');
if (regForm) {
    regForm.addEventListener('submit', async function (event) {
        event.preventDefault();
        const submitBtn = document.getElementById('regSubmitBtn');
        const msgBox = document.getElementById('registration-message') || document.getElementById('registrationMessage');

        const event_title = (document.getElementById('reg-event') || document.getElementById('eventTitle')).value;
        const full_name = (document.getElementById('reg-name') || document.getElementById('fullName')).value.trim();
        const nic = (document.getElementById('reg-nic') || document.getElementById('nic')).value.trim();
        const email = (document.getElementById('reg-email') || document.getElementById('email')).value.trim();

        if (!event_title || !full_name || !nic || !email) {
            msgBox.textContent = 'Please fill in all required fields.';
            msgBox.className = 'mt-4 p-3 rounded-lg bg-yellow-100 text-yellow-800';
            return;
        }

        // random ticket code ekak hadanawa
        const ticket_code = 'TCK-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        const currentUserId = localStorage.getItem('loggedInUserId') || 'Unknown';

        submitBtn.disabled = true;
        submitBtn.textContent = 'Registering & Generating QR/PDF...';

        try {
            const { error } = await supabaseClient.from('registrations').insert([{
                event_title, full_name, nic, email, ticket_code,
                status: 'Pending', created_by: currentUserId
            }]);

            if (error) throw error;

            msgBox.innerHTML = `Successfully registered! Your Ticket Code is: <b>${ticket_code}</b>. <br>Your PDF ticket with QR code has started downloading automatically.`;
            msgBox.className = 'mt-4 p-3 bg-green-100 text-green-800 rounded-lg font-medium';

            downloadTicketPDF({ event_title, full_name, nic, email, ticket_code });
            regForm.reset();
            loadRegEventDropdown();
        } catch (err) {
            console.error(err);
            msgBox.textContent = `Registration failed: ${err.message}`;
            msgBox.className = 'mt-4 p-3 bg-red-100 text-red-800 rounded-lg font-medium';
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Register & Download Ticket PDF';
        }
    });
}

// manual check-in form eka submit unama
const checkinForm = document.getElementById('checkinForm');
if (checkinForm) {
    checkinForm.addEventListener('submit', async function (event) {
        event.preventDefault();
        const ticketInput = (document.getElementById('checkin-ticket') || document.getElementById('checkinTicket')).value.trim();
        const nicInput = (document.getElementById('checkin-nic') || document.getElementById('checkinNic')).value.trim();
        await verifyAndCheckIn(ticketInput, nicInput);
    });
}

// venue add hari update hari karana form eka
const venueForm = document.getElementById('venueForm');
if (venueForm) {
    venueForm.addEventListener('submit', async e => {
        e.preventDefault();
        const saveBtn = document.getElementById('venue-save');
        const inputId = document.getElementById('venue-id').value.trim();
        const venue_name = document.getElementById('venue-name').value.trim();
        const capacity = parseInt(document.getElementById('venue-capacity').value);

        if (!venue_name || isNaN(capacity)) { alert('Please fill in valid venue details.'); return; }

        const venueData = { venue_name, capacity };
        saveBtn.disabled = true;
        try {
            if (!editingVenueId) {
                if (inputId) venueData.venue_id = inputId;
                const { error } = await supabaseClient.from('venues').insert([venueData]);
                if (error) throw error;
                showMessage('venue-message', 'Venue added successfully.', true);
            } else {
                const { error } = await supabaseClient.from('venues').update(venueData).eq('venue_id', editingVenueId);
                if (error) throw error;
                showMessage('venue-message', 'Venue updated successfully.', true);
            }
            resetVenueForm();
            await loadVenues();
        } catch (err) {
            console.error(err);
            showMessage('venue-message', `Operation failed: ${err.message}`, false);
        } finally {
            saveBtn.disabled = false;
        }
    });
}

// event add hari update hari karana form eka
const eventForm = document.getElementById('eventForm');
if (eventForm) {
    eventForm.addEventListener('submit', async e => {
        e.preventDefault();
        const saveBtn = document.getElementById('event-save');
        const event_name = document.getElementById('event-name').value.trim();
        const event_date = document.getElementById('event-date').value;
        const venue = document.getElementById('event-venue').value;

        if (!event_name || !event_date || !venue) { alert('Please fill in all event fields.'); return; }

        const eventData = { event_name, event_date, venue };
        saveBtn.disabled = true;
        try {
            if (!editingEventId) {
                const { error } = await supabaseClient.from('events').insert([eventData]);
                if (error) throw error;
                showMessage('event-message', 'Event added successfully.', true);
            } else {
                const { error } = await supabaseClient.from('events').update(eventData).or(`event_id.eq.${editingEventId},id.eq.${editingEventId}`);
                if (error) throw error;
                showMessage('event-message', 'Event updated successfully.', true);
            }
            resetEventForm();
            await loadEvents();
        } catch (err) {
            console.error(err);
            showMessage('event-message', `Operation failed: ${err.message}`, false);
        } finally {
            saveBtn.disabled = false;
        }
    });
}

// user add hari update hari karana form eka
const userForm = document.getElementById('userForm');
if (userForm) {
    userForm.addEventListener('submit', async e => {
        e.preventDefault();
        const saveButton = document.getElementById('user-save');
        const rowData = {
            user_id: document.getElementById('user-id').value.trim(),
            name: document.getElementById('user-name').value.trim(),
            email: document.getElementById('user-email').value.trim(),
            phone: document.getElementById('user-phone').value.trim()
        };

        if (!editingUserId) {
            rowData.password = document.getElementById('user-password').value;
            if (rowData.password.length < 8) { alert('Password must be at least 8 characters.'); return; }
            saveButton.disabled = true;
            try {
                const { error } = await supabaseClient.from('users').insert([rowData]);
                if (error) throw error;
                showMessage('user-message', 'User added successfully.', true);
                resetAccountForm('users');
                await loadAccounts('users');
            } catch (err) {
                showMessage('user-message', `Could not add user: ${err.message}`, false);
            } finally {
                saveButton.disabled = false;
            }
            return;
        }

        const oldPassword = document.getElementById('user-old-password').value;
        const newPassword = document.getElementById('user-new-password').value;
        if (!oldPassword) { alert('Old password is required.'); return; }

        saveButton.disabled = true;
        try {
            // parana password eka harida balanawa
            const { data: current, error: readError } = await supabaseClient.from('users').select('password').eq('user_id', editingUserId).maybeSingle();
            if (readError || !current) throw new Error('User validation failed.');
            if (String(current.password ?? '') !== oldPassword) throw new Error('Old password is incorrect.');

            const updateData = { name: rowData.name, email: rowData.email, phone: rowData.phone };
            if (newPassword) updateData.password = newPassword;

            const { error: updateError } = await supabaseClient.from('users').update(updateData).eq('user_id', editingUserId);
            if (updateError) throw updateError;

            showMessage('user-message', 'User updated successfully.', true);
            resetAccountForm('users');
            await loadAccounts('users');
        } catch (err) {
            showMessage('user-message', `Could not update user: ${err.message}`, false);
        } finally {
            saveButton.disabled = false;
        }
    });
}

// page eka load unama mulinma wena dewal
window.addEventListener('DOMContentLoaded', () => {
    if (isAdminPage) {
        showPage('register');
    } else if (document.getElementById('attendanceTable')) {
        loadEvents();
        loadVenues();
        loadRegEventDropdown();
        loadAttendanceReport();
    }
});