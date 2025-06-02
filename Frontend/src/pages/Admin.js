import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { handleError, handleSuccess } from "../utils";
import { ToastContainer } from "react-toastify";
import {
  FiEdit,
  FiTrash2,
  FiSearch,
  FiLogOut,
  FiUser,
  FiMail,
  FiKey,
} from "react-icons/fi";
import "./Admin.css";

function Admin() {
  const [loggedInUser, setLoggedInUser] = useState("");
  const [users, setUsers] = useState([]);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    role: "user",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalUsers: 0,
    totalPages: 1,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });
  const navigate = useNavigate();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      let url = `http://localhost:5000/users/?page=${pagination.page}&limit=${pagination.limit}`;

      if (searchTerm) {
        url += `&search=${searchTerm}`;
      }

      if (roleFilter) {
        url += `&role=${roleFilter}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: localStorage.getItem("token"),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      setUsers(result.data?.users || result || []);
      setPagination((prev) => ({
        ...prev,
        totalUsers: result.data?.total || result.total || 0,
        totalPages: result.data?.totalPages || result.totalPages || 1,
      }));
    } catch (err) {
      console.error("Fetch users error:", err);
      handleError(err);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchTerm, roleFilter]);

  useEffect(() => {
    const user = localStorage.getItem("loggedInUser");
    if (!user) {
      navigate("/login");
    }
    setLoggedInUser(user);
    fetchUsers();
  }, [navigate, fetchUsers]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("loggedInUser");
    handleSuccess("Logged out successfully");
    setTimeout(() => {
      navigate("/login");
    }, 1000);
  };

  const handleEditClick = (user) => {
    setEditingUserId(user._id);
    setEditFormData({
      name: user.name,
      email: user.email,
      role: user.role,
    });
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: value,
    });
  };

  const handleUpdateUser = async (userId) => {
    try {
      const response = await fetch(`http://localhost:5000/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: localStorage.getItem("token"),
        },
        body: JSON.stringify(editFormData),
      });

      if (!response.ok) {
        throw new Error("Failed to update user");
      }

      handleSuccess("User updated successfully");
      fetchUsers();
      setEditingUserId(null);
    } catch (err) {
      handleError(err);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        const response = await fetch(`http://localhost:5000/users/${userId}`, {
          method: "DELETE",
          headers: {
            Authorization: localStorage.getItem("token"),
          },
        });

        if (!response.ok) {
          throw new Error("Failed to delete user");
        }

        handleSuccess("User deleted successfully");

        if (users.length === 1 && pagination.page > 1) {
          setPagination((prev) => ({ ...prev, page: prev.page - 1 }));
        } else {
          fetchUsers();
        }
      } catch (err) {
        handleError(err);
      }
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();

    // Validate inputs
    const { name, email, password } = newUserData;
    if (!name || !email || !password) {
      return handleError("All fields are required");
    }

    try {
      const response = await fetch("http://localhost:5000/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`, // Added Bearer prefix
        },
        body: JSON.stringify(newUserData),
      });

      // Check if response is HTML
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Non-JSON response:", text);

        // Handle common error cases
        if (response.status === 401) {
          throw new Error("Session expired. Please login again.");
        } else if (response.status === 403) {
          throw new Error("You don't have permission to add users");
        } else {
          throw new Error(`Server error (${response.status})`);
        }
      }

      const result = await response.json();

      if (!response.ok) {
        // Handle API validation errors
        const errorMsg =
          result.error?.details?.[0]?.message ||
          result.message ||
          `Request failed with status ${response.status}`;
        throw new Error(errorMsg);
      }

      // Success case
      handleSuccess("User added successfully");
      setShowAddUserModal(false);
      setNewUserData({
        name: "",
        email: "",
        password: "",
        role: "user",
      });
      fetchUsers();
    } catch (err) {
      console.error("Add user error:", err);

      // Special handling for network errors
      if (err.message === "Failed to fetch") {
        handleError("Network error. Please check your connection.");
      } else {
        handleError(err.message);
      }

      // If unauthorized, redirect to login
      if (
        err.message.includes("Session expired") ||
        err.message.includes("401")
      ) {
        localStorage.removeItem("token");
        setTimeout(() => navigate("/login"), 2000);
      }
    }
  };

  const handleNewUserChange = (e) => {
    const { name, value } = e.target;
    setNewUserData({
      ...newUserData,
      [name]: value,
    });
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const resetFilters = () => {
    setSearchTerm("");
    setRoleFilter("");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Admin Dashboard</h1>
          <div className="user-profile">
            <div className="user-info">
              <div className="avatar">
                {loggedInUser.charAt(0).toUpperCase()}
              </div>
              <span className="username">Welcome, {loggedInUser}</span>
            </div>
            <button onClick={handleLogout} className="logout-btn">
              <FiLogOut className="icon" /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-content">
        <section className="users-section">
          <div className="section-header">
            <h2>
              <FiUser className="section-icon" /> User Management
            </h2>
            <div className="controls">
              <button
                className="add-user-btn"
                onClick={() => setShowAddUserModal(true)}
              >
                + Add New User
              </button>
            </div>
          </div>

          <div className="filters-section">
            <form onSubmit={handleSearch} className="search-form">
              <div className="search-input">
                <FiSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="role-filter"
              >
                <option value="">All Roles</option>
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="editor">Editor</option>
              </select>
              <button type="submit" className="search-btn">
                Search
              </button>
              <button
                type="button"
                className="reset-btn"
                onClick={resetFilters}
              >
                Reset
              </button>
            </form>
          </div>

          {loading ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Loading users...</p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length > 0 ? (
                      users.map((user) => (
                        <tr key={user._id}>
                          {editingUserId === user._id ? (
                            <>
                              <td>
                                <div className="form-group">
                                  <FiUser className="input-icon" />
                                  <input
                                    type="text"
                                    name="name"
                                    value={editFormData.name}
                                    onChange={handleEditFormChange}
                                    placeholder="Username"
                                  />
                                </div>
                              </td>
                              <td>
                                <div className="form-group">
                                  <FiMail className="input-icon" />
                                  <input
                                    type="email"
                                    name="email"
                                    value={editFormData.email}
                                    onChange={handleEditFormChange}
                                    placeholder="Email"
                                  />
                                </div>
                              </td>
                              <td>
                                <div className="form-group">
                                  <select
                                    name="role"
                                    value={editFormData.role}
                                    onChange={handleEditFormChange}
                                    className="role-select"
                                  >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                    <option value="editor">Editor</option>
                                  </select>
                                </div>
                              </td>
                              <td className="actions">
                                <button
                                  className="save-btn"
                                  onClick={() => handleUpdateUser(user._id)}
                                >
                                  Save
                                </button>
                                <button
                                  className="cancel-btn"
                                  onClick={() => setEditingUserId(null)}
                                >
                                  Cancel
                                </button>
                              </td>
                            </>
                          ) : (
                            <>
                              <td>{user.name}</td>
                              <td>{user.email}</td>
                              <td>
                                <span className={`role-badge ${user.role}`}>
                                  {user.role}
                                </span>
                              </td>
                              <td className="actions">
                                <button
                                  className="edit-btn"
                                  onClick={() => handleEditClick(user)}
                                  title="Edit"
                                >
                                  <FiEdit />
                                </button>
                                <button
                                  className="delete-btn"
                                  onClick={() => handleDeleteUser(user._id)}
                                  title="Delete"
                                >
                                  <FiTrash2 />
                                </button>
                              </td>
                            </>
                          )}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="no-users">
                          No users found. Try adjusting your search filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="table-footer">
                <div className="pagination-info">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.totalUsers
                  )}{" "}
                  of {pagination.totalUsers} users
                </div>

                {pagination.totalPages > 1 && (
                  <div className="pagination-controls">
                    <button
                      className="page-btn"
                      disabled={pagination.page === 1}
                      onClick={() => handlePageChange(pagination.page - 1)}
                    >
                      Previous
                    </button>

                    {Array.from(
                      { length: Math.min(5, pagination.totalPages) },
                      (_, i) => {
                        let pageNum;
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.page <= 3) {
                          pageNum = i + 1;
                        } else if (
                          pagination.page >=
                          pagination.totalPages - 2
                        ) {
                          pageNum = pagination.totalPages - 4 + i;
                        } else {
                          pageNum = pagination.page - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            className={`page-btn ${
                              pagination.page === pageNum ? "active" : ""
                            }`}
                            onClick={() => handlePageChange(pageNum)}
                          >
                            {pageNum}
                          </button>
                        );
                      }
                    )}

                    <button
                      className="page-btn"
                      disabled={pagination.page === pagination.totalPages}
                      onClick={() => handlePageChange(pagination.page + 1)}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </main>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Add New User</h3>
              <button
                className="close-btn"
                onClick={() => setShowAddUserModal(false)}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <FiUser className="input-icon" />
                <input
                  type="text"
                  name="name"
                  value={newUserData.name}
                  onChange={handleNewUserChange}
                  placeholder="Username"
                  required
                />
              </div>
              <div className="form-group">
                <FiMail className="input-icon" />
                <input
                  type="email"
                  name="email"
                  value={newUserData.email}
                  onChange={handleNewUserChange}
                  placeholder="Email"
                  required
                />
              </div>
              <div className="form-group">
                <FiKey className="input-icon" />
                <input
                  type="password"
                  name="password"
                  value={newUserData.password}
                  onChange={handleNewUserChange}
                  placeholder="Password"
                  required
                />
              </div>
              <div className="form-group">
                <select
                  name="role"
                  value={newUserData.role}
                  onChange={handleNewUserChange}
                  className="role-select"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="editor">Editor</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="cancel-btn"
                onClick={() => setShowAddUserModal(false)}
              >
                Cancel
              </button>
              <button className="save-btn" onClick={handleAddUser}>
                Add User
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default Admin;
