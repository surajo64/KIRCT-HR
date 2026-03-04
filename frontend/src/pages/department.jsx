import React, { useState, useEffect, useContext } from 'react';
import { toast } from "react-toastify";
import axios from 'axios';
import { AppContext } from '../context/AppContext';
import LoadingOverlay from '../components/loadingOverlay.jsx';


const Department = () => {
  const { token, getAllDepartment, setDepartment, department, backendUrl } = useContext(AppContext);
  const [selectedAdminId, setSelectedAdminId] = useState(null);
  const [designations, setDesignations] = useState(['']);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredDepartments, setFilteredDepartments] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5




  const onSubmitHandler = async (event) => {
  event.preventDefault();
  setIsLoading(true);

  try {
    const formData = { name, description, designations };

    if (editingAdmin && editingAdmin._id) {
      const { data } = await axios.post(
        backendUrl + '/api/admin/update-department',
        { departmentId: editingAdmin._id, ...formData },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success("Department updated successfully!");
        setShowForm(false);
        setName("");
        setDescription("");
        setDesignations("");
        getAllDepartment();
      }
    } else {
      const { data } = await axios.post(
        backendUrl + "/api/admin/add-department",
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success("Department added successfully!");
        setName("");
        setDescription("");
        setShowForm(false);
        setDesignations("");
        getAllDepartment();
      } else {
        toast.error(data.message);
      }
    }
  } catch (error) {
    toast.error("An error occurred while submitting.");
    console.error(error);
  } finally {
    setIsLoading(false); // Always hide loader
  }
};

  const handleDelete = async (id) => {
    const { data } = await axios.delete(
      backendUrl + `/api/admin/delete-department/${id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (data.success) {
      toast.success(data.message);
      setConfirmDeleteId(null);
      getAllDepartment();
    } else {
      toast.error("Failed to delete department");
    }
  };

  const handleAddNew = () => {
    setIsLoading(true);

    setTimeout(() => {
      setEditingAdmin(null);
      setName("");
      setDescription("");
      setShowForm(true);
      setIsLoading(false);
    }, 300);
  };


  const handleUpdate = (item) => {
    setIsLoading(true);

    setTimeout(() => {
      setEditingAdmin(item);
      setName(item.name);
      setDescription(item.description);
      setDesignations(item.designations)
      setShowForm(true);
      setIsLoading(false);
    }, 300);
  };


  const handleDesignationChange = (index, value) => {
    const newDesignations = [...designations];
    newDesignations[index] = value;
    setDesignations(newDesignations);
  };

  const handleAddDesignation = () => {
    setDesignations([...designations, '']);
  };

  const handleRemoveDesignation = (index) => {
    const newDesignations = [...designations];
    newDesignations.splice(index, 1);
    setDesignations(newDesignations.length > 0 ? newDesignations : ['']);
  };




  useEffect(() => {
    if (token) getAllDepartment();
  }, [token]);

  // Filter departments based on search
  useEffect(() => {
    const filtered = (department || []).filter((d) =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredDepartments(filtered);
    setCurrentPage(1); // Reset to first page on new search
    console.log("departments:", paginatedDepartments)
  }, [searchTerm, department]);

  // Pagination logic 
  const totalItems = department?.length;
  const totalPages = Math.ceil(filteredDepartments.length / itemsPerPage);
  const paginatedDepartments = filteredDepartments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

   

  if (!paginatedDepartments) return <LoadingOverlay />;

  return (
    <div className='w-full max-w-6xl mx-auto px-4 text-center'>
      <p className="text-xl sm:text-2xl font-bold text-gray-800 mt-5">MANAGE DEPARTMENT</p>

      {/* Search and Add Button */}
      <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mt-4'>
        <input
          type='text'
          placeholder='Search by Department Name...'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className='px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 w-full sm:w-1/3'
        />

        <button
          onClick={handleAddNew}
          className="bg-green-500 text-white py-2 px-4 rounded-md text-sm hover:bg-green-600 transition w-full sm:w-auto"
        >
          Add Department
        </button>
      </div>

      {/* Table container */}
      <div className='bg-white mt-6 rounded-lg shadow overflow-x-auto text-sm max-h-[80vh] min-h-[60vh]'>
        {/* Header */}
        <div className='bg-gray-200 hidden sm:grid grid-cols-[0.5fr_3fr_2fr] py-3 px-6 rounded-t-xl border-b-4 border-green-500'>
          <p className="hidden sm:block">#</p>
          <p>Department</p>
          <p>Actions</p>
        </div>

        {/* Table Rows */}
        {paginatedDepartments.length > 0 ? (
          paginatedDepartments.map((item, index) => (
            <div
              key={index}
              className="flex flex-col sm:grid sm:grid-cols-[0.5fr_3fr_2fr] items-start sm:items-center text-gray-500 py-3 px-6 border-b hover:bg-blue-50 gap-2"
            >
              <p className="hidden sm:block">{(currentPage - 1) * itemsPerPage + index + 1}</p>
              <p>{item.name}</p>

              <div className="flex sm:justify-end gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                <button
                  onClick={() => handleUpdate(item)}
                  className="bg-green-500 text-white text-sm px-3 py-1 rounded-full"
                >
                  Update
                </button>
                <button
                  onClick={() => {
                    setIsLoading(true);

                    setTimeout(() => {
                      setConfirmDeleteId(item._id)
                      setIsLoading(false);
                    }, 300);
                  }}
                  className="bg-red-500 text-white text-sm px-3 py-1 rounded-full"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center py-5 text-gray-500">No departments found.</p>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <>
            <div className="flex justify-center items-center flex-wrap gap-2 mt-4 px-4 pb-4">
              <button
                onClick={() => {
                  setIsLoading(true);

                  setTimeout(() => {
                    setCurrentPage(prev => Math.max(prev - 1, 1))

                    setIsLoading(false);
                  }, 300);
                }}

                disabled={currentPage === 1}
                className="text-white px-3 py-1 bg-blue-500 hover:bg-blue-800 rounded disabled:opacity-50"
              >
                Prev
              </button>

              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-1 rounded ${currentPage === i + 1
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                onClick={() => {
                  setIsLoading(true);
                  setTimeout(() => {
                    setCurrentPage(prev => Math.min(prev + 1, totalPages))
                    setIsLoading(false);
                  }, 300);
                }}
                disabled={currentPage === totalPages}
                className="text-white px-3 py-1 bg-blue-500 hover:bg-blue-800 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>

            <div className="flex justify-end mt-2 text-sm text-gray-800 px-4 pb-2">
              Showing {(currentPage - 1) * itemsPerPage + 1}–
              {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
            </div>
          </>
        )}
      </div>


      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-md relative">
            <button onClick={() => setShowForm(false)} className="font-bold text-3xl absolute top-2 right-4 text-red-700 hover:text-red-800">✕</button>
            <h2 className="text-2xl font-bold text-center mb-6 text-gray-700">
              {editingAdmin ? "Update Department" : "Add New Department"}
            </h2>

            <form onSubmit={onSubmitHandler} className="space-y-4">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Name Department"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Department Description"
              />
              <div>
                <label className="block font-semibold text-gray-700 mb-2">Designations</label>
                {designations.map((designation, index) => (
                  <div key={index} className="flex mb-2">
                    <input
                      type="text"
                      value={designation}
                      onChange={(e) => handleDesignationChange(index, e.target.value)}
                      required
                      placeholder={`Designation ${index + 1}`}
                      className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    {designations.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveDesignation(index)}
                        className="ml-2 text-red-600 font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddDesignation}
                  className="text-green-600 font-medium mt-1"
                >
                  + Add Designation
                </button>
              </div>
              <button
                type="submit"
                className="w-full bg-green-500 text-white py-2 rounded-md font-semibold hover:bg-green-600 transition"
              >
                {editingAdmin ? "Update Department" : "Add Department"}
              </button>
            </form>
          </div>
        </div>
      )}

      {confirmDeleteId && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 px-4">
          <div className="bg-white p-4 sm:p-6 rounded shadow-md w-full max-w-xs sm:w-80">
            <p className="text-red-500 mb-4 text-center font-semibold text-sm sm:text-base">
              Are you sure you want to delete this department?
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="bg-gray-300 px-6 py-2 rounded-full hover:bg-gray-400 w-full sm:w-auto"
              >
                Cancel
              </button>

              <button
                onClick={() => handleDelete(confirmDeleteId)}
                className="bg-red-500 text-white px-6 py-2 rounded-full hover:bg-red-600 w-full sm:w-auto"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {isLoading && <LoadingOverlay />}
    </div>
  );
};

export default Department;
