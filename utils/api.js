// ⚠️ CHANGE THIS to your Railway URL
var BASE = "https://farmer-production-1670.up.railway.app";

async function call(method, path, body) {
  try {
    var url = BASE + path;
    var opts = { method: method, headers: { "Content-Type": "application/json" } };
    if (body) opts.body = JSON.stringify(body);
    var res = await fetch(url, opts);
    if (!res.ok) { var err = await res.json().catch(function(){return {};}); return { error: err.error || "Server error" }; }
    return await res.json();
  } catch (err) {
    console.log("API:", path, err.message);
    return null;
  }
}

var API = {
  // Settings
  getSettings: function() { return call("GET", "/api/settings"); },
  updateSettings: function(d) { return call("PUT", "/api/settings", d); },

  // Varieties
  getVarieties: function() { return call("GET", "/api/varieties"); },
  addVariety: function(name, name_ta) { return call("POST", "/api/varieties", { name: name, name_ta: name_ta }); },
  updateVariety: function(id, name, name_ta) { return call("PUT", "/api/varieties/" + id, { name: name, name_ta: name_ta }); },
  deleteVariety: function(id) { return call("DELETE", "/api/varieties/" + id); },

  // Employees
  getEmployees: function() { return call("GET", "/api/employees"); },
  addEmployee: function(n, g, ph, wage, type) { return call("POST", "/api/employees", { name: n, gender: g, phone: ph, daily_wage: wage, emp_type: type }); },
  updateEmployee: function(id, d) { return call("PUT", "/api/employees/" + id, d); },
  deleteEmployee: function(id) { return call("DELETE", "/api/employees/" + id); },

  // Attendance
  getAttendance: function(f, t) { return call("GET", "/api/attendance?from=" + f + "&to=" + t); },
  setAttendance: function(e, d, s) { return call("POST", "/api/attendance", { emp_id: e, date: d, status: s }); },
  bulkAttendance: function(d, ids, s) { return call("POST", "/api/attendance/bulk", { date: d, emp_ids: ids, status: s }); },

  // Advances & Payments
  addAdvance: function(e, d, a, n) { return call("POST", "/api/advances", { emp_id: e, date: d, amount: a, note: n }); },
  deleteAdvance: function(id) { return call("DELETE", "/api/advances/" + id); },
  addPayment: function(e, d, a, p) { return call("POST", "/api/payments", { emp_id: e, date: d, amount: a, period: p }); },
  deletePayment: function(id) { return call("DELETE", "/api/payments/" + id); },

  // Purchases
  getPurchases: function(y) { return call("GET", "/api/purchases" + (y ? "?year=" + y : "")); },
  addPurchase: function(d) { return call("POST", "/api/purchases", d); },
  deletePurchase: function(id) { return call("DELETE", "/api/purchases/" + id); },

  // Sales
  getSales: function(y) { return call("GET", "/api/sales" + (y ? "?year=" + y : "")); },
  addSale: function(d) { return call("POST", "/api/sales", d); },
  deleteSale: function(id) { return call("DELETE", "/api/sales/" + id); },

  // Processing
  getProcessing: function() { return call("GET", "/api/processing"); },
  autoProcess: function(d) { return call("POST", "/api/processing/auto", d); },
  addProcessing: function(d) { return call("POST", "/api/processing", d); },
  deleteProcessing: function(id) { return call("DELETE", "/api/processing/" + id); },

  // Market Sales
  getMarketSales: function() { return call("GET", "/api/market-sales"); },
  addMarketSale: function(d) { return call("POST", "/api/market-sales", d); },
  deleteMarketSale: function(id) { return call("DELETE", "/api/market-sales/" + id); },

  // Dashboard
  getDashboard: function() { return call("GET", "/api/dashboard"); },

  // Reports
  getSalaryReport: function(m) { return call("GET", "/api/reports/salary?month=" + m); },
  getProfitReport: function(y) { return call("GET", "/api/reports/profit" + (y ? "?year=" + y : "")); },
  getStockReport: function() { return call("GET", "/api/reports/stock"); },
  getFarmersReport: function(y) { return call("GET", "/api/reports/farmers" + (y ? "?year=" + y : "")); },

  // OCR
  detectWeight: function(b64) { return call("POST", "/api/ocr/weight", { imageBase64: b64 }); },
};

module.exports = API;
