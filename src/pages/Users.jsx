import React, { useState, useEffect, useCallback } from 'react';
import { UserPlus, Trash2, Edit, Shield, User, X, Save, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';

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
    <div className="h-full p-8 flex flex-col overflow-hidden relative">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-10 right-10 w-96 h-96 bg-purple-500/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-cyan-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="flex justify-between items-center mb-8 z-10 shrink-0">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <Shield className="text-cyan-500" size={32} /> User Management
          </h1>
          <p className="text-slate-400 mt-1 font-medium">Manage system access and staff roles.</p>
        </div>
        <Button
          variant="primary"
          onClick={() => { setEditingId(null); setFormData({ name: '', username: '', password: '', role: 'staff' }); setIsModalOpen(true); }}
          className="shadow-lg shadow-cyan-900/20"
        >
          <UserPlus size={18} className="mr-2" /> Add User
        </Button>
      </div>

      <div className="flex-1 bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm relative z-10 flex flex-col">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-slate-900/50">
                <TableHead className="pl-6">Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {users.map(user => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="bg-slate-900/20 hover:bg-slate-800/50 transition-colors border-b border-slate-800/50"
                  >
                    <TableCell className="pl-6 font-bold text-white flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold border border-slate-700">
                        {user.name.charAt(0)}
                      </div>
                      {user.name}
                    </TableCell>
                    <TableCell className="font-mono text-slate-400">{user.username}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'admin' ? 'warning' : 'neutral'} className="uppercase tracking-wider">
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(user)} className="text-slate-400 hover:text-white">
                          <Edit size={16} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(user.id)} className="text-slate-400 hover:text-red-400">
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md"
            >
              <Card className="p-0 overflow-hidden border-slate-800 bg-[#0f172a] shadow-2xl">
                <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    {editingId ? <Edit className="text-cyan-400" size={20} /> : <UserPlus className="text-cyan-400" size={20} />}
                    {editingId ? 'Edit User' : 'New User'}
                  </h2>
                  <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)}><X /></Button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                  <Input
                    label="Full Name"
                    icon={User}
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                  <Input
                    label="Username"
                    icon={Shield}
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                    required
                  />
                  <div className="space-y-1">
                    <Input
                      label={`Password ${editingId ? '(Leave blank to keep)' : ''}`}
                      icon={Lock}
                      type="password"
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      required={!editingId}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Role</label>
                    <select
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-cyan-500 transition-all"
                      value={formData.role}
                      onChange={e => setFormData({ ...formData, role: e.target.value })}
                    >
                      <option value="staff">Staff - Point of Sale Access</option>
                      <option value="admin">Admin - Full System Access</option>
                    </select>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-slate-800 mt-2">
                    <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                    <Button type="submit" variant="primary" className="flex-1 shadow-lg shadow-cyan-900/20">
                      <Save size={18} className="mr-2" /> Save User
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
