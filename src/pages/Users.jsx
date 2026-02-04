import React, { useState, useEffect, useCallback } from 'react';
import { UserPlus, Trash2, Edit, Shield, User } from 'lucide-react';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', username: '', password: '', role: 'staff' });
  const [editingId, setEditingId] = useState(null);

  const loadUsers = useCallback(async () => {
    try {
      const data = await window.api.getUsers();
      setUsers(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await window.api.updateUser({ ...formData, id: editingId });
      } else {
        await window.api.addUser(formData);
      }
      setIsModalOpen(false);
      setFormData({ name: '', username: '', password: '', role: 'staff' });
      setEditingId(null);
      loadUsers();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete user?")) return;
    try {
      await window.api.deleteUser(id);
      loadUsers();
    } catch (e) { alert(e.message); }
  };

  const openEdit = (user) => {
    setFormData({ name: user.name, username: user.username, role: user.role, password: '' });
    setEditingId(user.id);
    setIsModalOpen(true);
  };

  return (
    <div className="h-full p-8 flex flex-col bg-[#0f172a] text-slate-200 font-sans">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <Shield className="text-cyan-500" size={32} /> User Management
          </h1>
          <p className="text-slate-400 mt-1">Manage system access and staff roles.</p>
        </div>
        <button 
          onClick={() => { setEditingId(null); setFormData({ name: '', username: '', password: '', role: 'staff' }); setIsModalOpen(true); }}
          className="bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all"
        >
          <UserPlus size={18} /> Add User
        </button>
      </div>

      <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-900/90 border-b border-slate-800 text-xs font-bold uppercase text-slate-500">
            <tr>
              <th className="p-5">Name</th>
              <th className="p-5">Username</th>
              <th className="p-5">Role</th>
              <th className="p-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="p-5 font-bold text-white">{user.name}</td>
                <td className="p-5 font-mono text-slate-400">{user.username}</td>
                <td className="p-5">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${user.role === 'admin' ? 'bg-purple-900/30 text-purple-400 border border-purple-800' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="p-5 text-right flex justify-end gap-2">
                  <button onClick={() => openEdit(user)} className="p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-white"><Edit size={16} /></button>
                  <button onClick={() => handleDelete(user.id)} className="p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-red-400"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-6">{editingId ? 'Edit User' : 'New User'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Full Name</label>
                <input className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-cyan-500"
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Username</label>
                <input className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-cyan-500"
                  value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} required />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Password {editingId && '(Leave blank to keep)'}</label>
                <input className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-cyan-500"
                  type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required={!editingId} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Role</label>
                <select className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-cyan-500"
                  value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 rounded-lg text-slate-400 hover:bg-slate-800 font-bold">Cancel</button>
                <button type="submit" className="flex-1 py-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-lg">Save User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
