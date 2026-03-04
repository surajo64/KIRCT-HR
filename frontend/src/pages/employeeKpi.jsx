import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AppContext } from '../context/AppContext';
import LoadingOverlay from '../components/loadingOverlay.jsx';

const criteriaList = [
  { label: "Punctuality", key: "punctuality", max: 20 },
  { label: "Productivity", key: "research", max: 20 },
  { label: "Collaboration", key: "teamwork", max: 15 },
  { label: "Initiative", key: "initiative", max: 15 },
  { label: "Professionalism", key: "professionalism", max: 15 },
  { label: "Communication", key: "communication", max: 15 },
];


const employeeKpi = () => {
  const { token, fetchKpi, kpi, setKpi, backendUrl } = useContext(AppContext);
const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [scores, setScores] = useState({});
  const [comments, setComments] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [showDetail, setShowDetail] = useState(false);



  const getTotalScore = () => {
    const total = Object.values(scores).reduce((acc, val) => acc + val, 0);
    return total;
  };

  const getMaxScore = () =>
    criteriaList.reduce((total, { max }) => total + max, 0);

  const getGrade = () => {
    const total = getTotalScore();
    const max = getMaxScore();
    const percentage = (total / max) * 100;

    if (percentage >= 80) return "Excelence";
    if (percentage >= 70) return "Very Good";
    if (percentage >= 60) return "Good";
    if (percentage >= 50) return "fair";
    return "Poor";
  };



  const formData = {
    scores,
    total: getTotalScore(),
    grade: getGrade(),
    comments,
    year: new Date().getFullYear(),
    month,
  };


  const handleScoreChange = (key, value) => {
    setScores({ ...scores, [key]: Number(value) });
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
setIsLoading(true);
    try {
      const { data } = await axios.post(`${backendUrl}/api/admin/kpi`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        toast.success('KPI Submitted');
        resetForm();
        setShowForm(false);
        fetchKpi(); // Refresh the KPI list
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Evaluation error:", error);
      res.status(500).json({ success: false, message: 'Error submitting KPI' });
    }finally {
            setIsLoading(false);
        }

  };


  const resetForm = () => {
    setShowForm(false);
    setIsEditing(null);
    setEmployeeName('');
    setScores({});
    setComments('');
    setMonth('');
    setYear('');
  };

  useEffect(() => {
    fetchKpi();
  }, []);


  const handleView = (item) => {
    setIsLoading(true);
        setTimeout(() => {
    setShowDetail(true);
    setSelectedRecords(item)
     setIsLoading(false);
        }, 300);
  };



  const handleAddNew = () => {
    setIsLoading(true);
        setTimeout(() => {
    setShowForm(true);
     setIsLoading(false);
        }, 300);
  };


  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6">
  <p className="text-xl sm:text-2xl font-bold text-gray-800 text-center">EMPLOYEE KPI</p>

  {/* Add Button */}
  <div className="flex justify-end mt-4">
    <button
      onClick={handleAddNew}
      className="bg-green-500 text-white py-2 px-4 rounded-md text-sm hover:bg-green-600 transition"
    >
      Add KPI
    </button>
  </div>

  {/* KPI Table */}
  <div className="bg-white text-sm mt-4 max-h-[80vh] min-h-[60vh] overflow-auto rounded-md shadow-sm">
    {/* Header: visible only on sm and above */}
    <div className="hidden sm:grid grid-cols-[0.5fr_2fr_2fr_2fr_1fr] bg-gray-200 py-3 px-4 rounded-t-md border-b-4 border-green-500 font-semibold">
      <p>#</p>
      <p>Self Rating</p>
      <p>HOD Rating</p>
      <p>HR Rating</p>
      <p>Actions</p>
    </div>

    {/* Data Rows */}
    {kpi && kpi.length > 0 ? (
      kpi.map((item, index) => (
        <div
          key={index}
          className="flex flex-wrap sm:grid sm:grid-cols-[0.5fr_2fr_2fr_2fr_1fr] items-center gap-2 sm:gap-0 text-gray-700 py-3 px-4 border-b hover:bg-blue-50"
        >
          <p>{index + 1}</p>

          <p>{item.kpi?.total || "N/A"}</p>

          <p>
            {item.hodEvaluation
              ? `${item.hodEvaluation.total} (${item.hodEvaluation.grade})`
              : "Not yet submitted"}
          </p>

          <p>
            {item.adminEvaluation
              ? `${item.adminEvaluation.total} (${item.adminEvaluation.grade})`
              : "Not yet submitted"}
          </p>

          <div className="flex justify-start sm:justify-end">
            <button
              onClick={() => handleView(item)}
              className="bg-blue-500 text-white text-sm px-3 py-1 rounded-full"
            >
              View Detail
            </button>
          </div>
        </div>
      ))
    ) : (
      <p className="text-center py-5 text-gray-500">No KPI records found.</p>
    )}
      </div>

      {showForm && (
  <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
    <div className="bg-white w-full max-w-2xl rounded-lg shadow-lg p-4 sm:p-6 relative max-h-[90vh] overflow-y-auto">
      <button
        onClick={() => setShowForm(false)}
        className="absolute top-3 right-4 text-xl text-red-600 font-bold"
      >
        ✕
      </button>

      <h3 className="text-lg sm:text-xl font-bold mb-4 text-green-600 text-center">
        Employee Self Evaluation Form
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Month & Year */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-1">Evaluation Month</label>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Select Month</option>
              {[
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
              ].map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium mb-1">Evaluation Year</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              min="2000"
              max={new Date().getFullYear() + 1}
              required
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {/* KPI Criteria */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {criteriaList.map(({ label, key, max }) => (
            <div key={key}>
              <label className="block font-medium mb-1">
                {label} (Max: {max})
              </label>
              <input
                type="number"
                min="0"
                max={max}
                value={scores[key]}
                onChange={(e) => handleScoreChange(key, e.target.value)}
                required
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          ))}
        </div>

        {/* Comments */}
        <textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder="Evaluator's Comments"
          className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          rows={3}
        ></textarea>

        {/* Total & Grade */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div><strong>Total Score:</strong> {getTotalScore()} / 100</div>
          <div><strong>Grade:</strong> {getGrade()}</div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-green-500 text-white py-2 rounded-md font-semibold hover:bg-green-600 transition"
        >
          Submit Evaluation
        </button>
      </form>
    </div>
  </div>
)}


      {showDetail && selectedRecords && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-6xl relative overflow-auto max-h-[95vh]">
            <button
              onClick={() => setShowDetail(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-red-600 text-xl font-bold"
            >
              ✕
            </button>

            <h2 className="text-2xl font-bold text-center text-gray-700 col-span-3">
              Your Evaluation Summary For
            </h2>
            <h2 className="text-2xl font-bold mb-6 text-center text-blue-700 col-span-3">
              {selectedRecords.kpi?.month} {selectedRecords.kpi?.year}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* ✅ LEFT COLUMN: KPI + HOD Evaluation */}
              <div className="col-span-1 border rounded-lg p-4 bg-gray-50 shadow-inner overflow-auto max-h-[600px]">
                {/* Employee KPI */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-green-600 mb-4">Employee KPI</h3>

                  <table className="w-full text-sm text-start border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                    <tbody>
                      
                      <tr className="bg-gray-50 border-b">
                        <td className="px-4 py-2 font-medium text-gray-600">Punctuality</td>
                        <td className="px-4 py-2">{selectedRecords.kpi?.scores.punctuality}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="px-4 py-2 font-medium text-gray-600">Productivity</td>
                        <td className="px-4 py-2">{selectedRecords.kpi?.scores.research || 'N/A'}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="px-4 py-2 font-medium text-gray-600">Collaborations</td>
                        <td className="px-4 py-2">{selectedRecords.kpi?.scores?.teamwork}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="px-4 py-2 font-medium text-gray-600">Initiative</td>
                        <td className="px-4 py-2">{selectedRecords.kpi?.scores?.initiative}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="px-4 py-2 font-medium text-gray-600">Professionalism</td>
                        <td className="px-4 py-2">{selectedRecords.kpi?.scores?.professionalism}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="px-4 py-2 font-medium text-gray-600">Communication</td>
                        <td className="px-4 py-2">{selectedRecords.kpi?.scores?.communication}</td>
                      </tr>
                      <tr className="border-b">
                          <td className="px-4 py-2 font-semibold text-black">Total Score</td>
                          <td className="px-4 py-2 font-semibold text-black">{selectedRecords.kpi.total} / 100</td>
                        </tr>
                     
                      <tr className="border-b">
                        <td className="px-4 py-2 font-bold">Grade</td>
                        <td className={`px-4 py-2 font-bold 
                                                             ${selectedRecords.kpi.total >= 80
                            ? 'text-green-600'
                            : selectedRecords.kpi.total >= 70
                              ? 'text-blue-600'
                              : selectedRecords.kpi.total >= 60
                                ? 'text-yellow-600'
                                : 'text-red-600'
                          }`}
                        >
                          {selectedRecords.kpi.grade}
                        </td>

                      </tr>
                      <tr className="border-b">
                        <td className="px-4 py-2 font-medium text-gray-600">Comments</td>
                        <td className="px-4 py-2">{selectedRecords.kpi?.comments}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-medium text-gray-600">Evaluated On</td>
                        <td className="px-4 py-2">{new Date(selectedRecords.kpi?.createdAt).toLocaleDateString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

              </div>

              {/* ✅ MIDDLE COLUMN: HOD Evaluation */}
              <div className="col-span-1 border rounded-lg p-4 bg-gray-50 shadow-inner overflow-auto max-h-[600px]">
                <div className="mb-6">


                  <h3 className="text-lg font-bold mb-4 text-green-600 text-center">HOD Evaluation</h3>
                  {selectedRecords.hodEvaluation ? (
                    <table className="w-full text-sm text-start border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                      <tbody>
                       
                        <tr className="bg-gray-50 border-b">
                          <td className="px-4 py-2 font-medium text-gray-600">Punctuality</td>
                          <td className="px-4 py-2">{selectedRecords.hodEvaluation?.scores?.punctuality}</td>
                        </tr>
                        <tr className="border-b">
                          <td className="px-4 py-2 font-medium text-gray-600">Productivity</td>
                          <td className="px-4 py-2">{selectedRecords.hodEvaluation?.scores?.research}</td>
                        </tr>
                        <tr className="bg-gray-50 border-b">
                          <td className="px-4 py-2 font-medium text-gray-600">Teamwork</td>
                          <td className="px-4 py-2">{selectedRecords.hodEvaluation?.scores?.teamwork}</td>
                        </tr>
                        <tr className="border-b">
                          <td className="px-4 py-2 font-medium text-gray-600">Initiative</td>
                          <td className="px-4 py-2">{selectedRecords.hodEvaluation?.scores?.initiative}</td>
                        </tr>
                        <tr className="bg-gray-50 border-b">
                          <td className="px-4 py-2 font-medium text-gray-600">Professionalism</td>
                          <td className="px-4 py-2">{selectedRecords.hodEvaluation?.scores?.professionalism}</td>
                        </tr>
                        <tr className="border-b">
                          <td className="px-4 py-2 font-medium text-gray-600">Communication</td>
                          <td className="px-4 py-2">{selectedRecords.hodEvaluation?.scores?.communication}</td>
                        </tr>
                        <tr className="bg-gray-50 border-b">
                          <td className="px-4 py-2 font-semibold text-black">Total Score</td>
                          <td className="px-4 py-2 font-semibold text-black">{selectedRecords.hodEvaluation?.total} / 100</td>
                        </tr>
                        <tr className="border-b">
                          <td className="px-4 py-2 font-bold">Grade</td>
                          <td className={`px-4 py-2 font-bold 
                                                             ${selectedRecords.hodEvaluation?.total >= 80
                              ? 'text-green-600'
                              : selectedRecords.hodEvaluation?.total >= 70
                                ? 'text-blue-600'
                                : selectedRecords.hodEvaluation?.total >= 60
                                  ? 'text-yellow-600'
                                  : 'text-red-600'
                            }`}
                          >
                            {selectedRecords.hodEvaluation?.grade}
                          </td>
                        </tr>
                        <tr className="bg-gray-50 border-b">
                          <td className="px-4 py-2 font-medium text-gray-600">Comments</td>
                          <td className="px-4 py-2">{selectedRecords.hodEvaluation?.comments || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 font-medium text-gray-600">Evaluated On</td>
                          <td className="px-4 py-2">{new Date(selectedRecords.hodEvaluation?.createdAt).toLocaleDateString()}</td>
                        </tr>
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center text-red-500 font-semibold mt-4">
                      HOD has not evaluated you yet.
                    </div>
                  )}
                </div>
              </div>

              {/* ✅ RIGHT COLUMN: ADMIN Evaluation */}
              <div className="col-span-1 border rounded-lg p-4 bg-gray-50 shadow-inner overflow-auto max-h-[600px]">
                <div className="mb-6">
                  <h3 className="text-lg font-bold mb-4 text-green-600 text-center">HR Evaluation</h3>

                  {selectedRecords.adminEvaluation ? (
                    <table className="w-full text-sm text-start border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                      <tbody>
                        
                        <tr className="bg-gray-50 border-b">
                          <td className="px-4 py-2 font-medium text-gray-600">Punctuality</td>
                          <td className="px-4 py-2">{selectedRecords.adminEvaluation.scores?.punctuality}</td>
                        </tr>
                        <tr className="border-b">
                          <td className="px-4 py-2 font-medium text-gray-600">Productivity</td>
                          <td className="px-4 py-2">{selectedRecords.adminEvaluation.scores?.research}</td>
                        </tr>
                        <tr className="bg-gray-50 border-b">
                          <td className="px-4 py-2 font-medium text-gray-600">Teamwork</td>
                          <td className="px-4 py-2">{selectedRecords.adminEvaluation.scores?.teamwork}</td>
                        </tr>
                        <tr className="border-b">
                          <td className="px-4 py-2 font-medium text-gray-600">Initiative</td>
                          <td className="px-4 py-2">{selectedRecords.adminEvaluation.scores?.initiative}</td>
                        </tr>
                        <tr className="bg-gray-50 border-b">
                          <td className="px-4 py-2 font-medium text-gray-600">Professionalism</td>
                          <td className="px-4 py-2">{selectedRecords.adminEvaluation.scores?.professionalism}</td>
                        </tr>
                        <tr className="border-b">
                          <td className="px-4 py-2 font-medium text-gray-600">Communication</td>
                          <td className="px-4 py-2">{selectedRecords.adminEvaluation.scores?.communication}</td>
                        </tr>
                        <tr className="bg-gray-50 border-b">
                          <td className="px-4 py-2 font-semibold text-black">Total Score</td>
                          <td className="px-4 py-2 font-semibold text-black">{selectedRecords.adminEvaluation.total} / 100</td>
                        </tr>
                        <tr className="border-b">
                          <td className="px-4 py-2 font-bold">Grade</td>
                          <td className={`px-4 py-2 font-bold 
                                                             ${selectedRecords.adminEvaluation?.total >= 80
                              ? 'text-green-600'
                              : selectedRecords.adminEvaluation?.total >= 70
                                ? 'text-blue-600'
                                : selectedRecords.adminEvaluation?.total >= 60
                                  ? 'text-yellow-600'
                                  : 'text-red-600'
                            }`}
                          >
                            {selectedRecords.adminEvaluation?.grade}
                          </td>
                        </tr>
                        <tr className="bg-gray-50 border-b">
                          <td className="px-4 py-2 font-medium text-gray-600">Comments</td>
                          <td className="px-4 py-2">{selectedRecords.adminEvaluation.comments || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 font-medium text-gray-600">Evaluated On</td>
                          <td className="px-4 py-2">{new Date(selectedRecords.adminEvaluation.createdAt).toLocaleDateString()}</td>
                        </tr>
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center text-red-500 font-semibold mt-4">
                      Admin has not evaluated You yet.
                    </div>
                  )}
                </div>




              </div>
            </div>
          </div>
        </div >
      )
      }
       {isLoading && <LoadingOverlay />}
    </div >
  );
};
export default employeeKpi;
