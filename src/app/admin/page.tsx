"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

export default function AdminPage() {
  // === ESTADOS DE AUTENTICACIÓN ===
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // === ESTADOS DEL ADMIN ===
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modales Principales
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isFieldsModalOpen, setIsFieldsModalOpen] = useState(false);

  // Estado para Crear / Editar Producto
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [productForm, setProductForm] = useState({ name: '', description: '', base_price: 0 });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado para la Gestión de Campos Dinámicos
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [fields, setFields] = useState<any[]>([]);
  const [newField, setNewField] = useState({ label: '', type: 'text', placeholder: '' });

  // Estado para Opciones de campos tipo Select
  const [selectedField, setSelectedField] = useState<any | null>(null);
  const [options, setOptions] = useState<any[]>([]);
  const [newOptionLabel, setNewOptionLabel] = useState('');
  const [newOptionPrice, setNewOptionPrice] = useState<number>(0);
  const [optionImageFile, setOptionImageFile] = useState<File | null>(null);

  // --- 1. GESTIÓN DE SESIÓN ---
  useEffect(() => {
    // Revisar si ya hay una sesión activa al cargar
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Escuchar cambios (login / logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setAuthError('Correo o contraseña incorrectos.');
    }
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // --- 2. CARGAR DATOS (Solo se llama si hay sesión) ---
  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (!error) setProducts(data || []);
    setLoading(false);
  };

  const fetchFieldsAndOptions = async (productId: string) => {
    const { data: fieldsData } = await supabase
      .from('product_fields')
      .select('*')
      .eq('product_id', productId)
      .order('sort_order', { ascending: true });

    setFields(fieldsData || []);
    setSelectedField(null);
    setOptions([]);
  };

  const fetchOptions = async (fieldId: string) => {
    const { data: optionsData } = await supabase
      .from('field_options')
      .select('*')
      .eq('field_id', fieldId);
    setOptions(optionsData || []);
  };

  // Cargar productos cuando la sesión se valide
  useEffect(() => {
    if (session) {
      fetchProducts();
    }
  }, [session]);

  // --- 3. LÓGICAS DEL ADMIN ---
  // (Mantenemos exactamente tus mismas funciones de guardado y eliminación)
  const openCreateModal = () => {
    setEditingProduct(null);
    setProductForm({ name: '', description: '', base_price: 0 });
    setImageFile(null);
    setIsProductModalOpen(true);
  };

  const openEditModal = (product: any) => {
    setEditingProduct(product);
    setProductForm({ name: product.name, description: product.description, base_price: product.base_price });
    setImageFile(null);
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    let card_image = editingProduct?.card_image || '';

    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `tarjetas/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('product-images').upload(filePath, imageFile);

      if (!uploadError) {
        const { data } = supabase.storage.from('product-images').getPublicUrl(filePath);
        card_image = data.publicUrl;
      }
    }

    if (editingProduct) {
      const { error } = await supabase
        .from('products')
        .update({ name: productForm.name, description: productForm.description, base_price: productForm.base_price, card_image })
        .eq('id', editingProduct.id);
      if (error) alert('Error al modificar');
    } else {
      const { error } = await supabase
        .from('products')
        .insert([{ name: productForm.name, description: productForm.description, base_price: productForm.base_price, card_image, status: 'Activo' }]);
      if (error) alert('Error al guardar');
    }

    setIsProductModalOpen(false);
    fetchProducts();
    setIsSubmitting(false);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('¿Eliminar este producto y todos sus campos asociados?')) return;
    await supabase.from('products').delete().eq('id', id);
    fetchProducts();
  };

  const openFieldsModal = (product: any) => {
    setSelectedProduct(product);
    fetchFieldsAndOptions(product.id);
    setIsFieldsModalOpen(true);
  };

  const handleAddField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const { error } = await supabase
      .from('product_fields')
      .insert([{ product_id: selectedProduct.id, label: newField.label, type: newField.type, placeholder: newField.placeholder }]);

    if (!error) {
      setNewField({ label: '', type: 'text', placeholder: '' });
      fetchFieldsAndOptions(selectedProduct.id);
    }
  };

  const handleDeleteField = async (fieldId: string) => {
    await supabase.from('product_fields').delete().eq('id', fieldId);
    fetchFieldsAndOptions(selectedProduct.id);
  };

  const handleAddFieldOption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedField || !newOptionLabel) return;

    let preview_image = '';

    if (optionImageFile) {
      const fileExt = optionImageFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `previews/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('product-images').upload(filePath, optionImageFile);

      if (!uploadError) {
        const { data } = supabase.storage.from('product-images').getPublicUrl(filePath);
        preview_image = data.publicUrl;
      }
    }

    const { error } = await supabase
      .from('field_options')
      .insert([{
        field_id: selectedField.id,
        label: newOptionLabel,
        preview_image,
        additional_price: newOptionPrice
      }]);

    if (!error) {
      setNewOptionLabel('');
      setNewOptionPrice(0);
      setOptionImageFile(null);
      fetchOptions(selectedField.id);
    }
  };

  const handleDeleteOption = async (optionId: string) => {
    await supabase.from('field_options').delete().eq('id', optionId);
    if (selectedField) fetchOptions(selectedField.id);
  };


  // ==========================================
  // VISTA 1: FORMULARIO DE LOGIN (SI NO HAY SESIÓN)
  // ==========================================
  if (!session) {
    return (
      <div className="min-h-screen bg-[#f4eae0] flex items-center justify-center p-4">
        <div className="bg-white p-8 md:p-10 rounded-[32px] shadow-[0_18px_45px_rgba(113,64,42,0.14)] w-full max-w-md">
          <div className="flex justify-center mb-8">
            <img src={"/logo.png"} alt='Momentiva' className="h-16 w-auto object-contain" />
          </div>
          <h2 className="text-2xl font-black text-center text-[#71402a] mb-2">Acceso Administrativo</h2>
          <p className="text-center text-[#c99598] text-sm mb-8 font-semibold">Ingresa tus credenciales para continuar</p>
          
          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            {authError && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-100 text-center font-bold">
                {authError}
              </div>
            )}
            <label className="flex flex-col gap-2 font-bold text-[#71402a] text-sm">
              Correo electrónico
              <input 
                type="email" 
                required 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="border border-[#e4d1c7] rounded-2xl p-3 outline-none focus:border-[#71402a] font-normal"
                placeholder="tu@correo.com"
              />
            </label>
            <label className="flex flex-col gap-2 font-bold text-[#71402a] text-sm">
              Contraseña
              <input 
                type="password" 
                required 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="border border-[#e4d1c7] rounded-2xl p-3 outline-none focus:border-[#71402a] font-normal"
                placeholder="••••••••"
              />
            </label>
            <button 
              type="submit" 
              disabled={authLoading}
              className="bg-[#c99598] hover:bg-[#71402a] text-white font-extrabold rounded-full py-4 mt-4 transition-colors shadow-lg disabled:opacity-50"
            >
              {authLoading ? 'Verificando...' : 'Entrar al Panel'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // VISTA 2: PANEL DE ADMINISTRACIÓN PRINCIPAL
  // ==========================================
  return (
    <div className="min-h-screen bg-[#f4eae0] flex flex-col md:flex-row">
      {/* SIDEBAR */}
      <aside className="w-full md:w-64 bg-white border-r border-[#e4d1c7] p-6 flex flex-col">
        <div className="mb-10">
          <img src={"/logo.png"} alt='Momentiva' className="h-10 w-auto object-contain" />
          <div className="text-xs font-bold text-[#c99598] mt-2 uppercase tracking-wider">Panel Admin</div>
        </div>
        <nav className="flex flex-col gap-4 flex-1">
          <a href="#" className="font-bold text-[#71402a] bg-[#f4eae0] p-3 rounded-xl border border-[#e4d1c7]">📦 Catálogo</a>
        </nav>
        
        {/* BOTÓN DE CERRAR SESIÓN */}
        <button 
          onClick={handleLogout}
          className="mt-auto pt-6 flex items-center justify-center gap-2 text-[#71402a] hover:text-red-500 font-bold transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
          </svg>
          Cerrar sesión
        </button>
      </aside>

      {/* TABLA PRINCIPAL */}
      <main className="flex-1 p-8 relative overflow-y-auto">
        <header className="flex justify-between items-center mb-10 bg-white p-6 rounded-3xl shadow-sm border border-[#e4d1c7]">
          <div>
            <h1 className="text-3xl font-extrabold text-[#71402a]">Catálogo</h1>
            <p className="text-[#c99598] mt-1 font-medium">Gestiona productos, campos de formulario y fotos.</p>
          </div>
          <button onClick={openCreateModal} className="bg-[#c99598] hover:bg-[#71402a] text-white font-bold py-3 px-6 rounded-full shadow-lg transition-colors">
            + Nuevo Producto
          </button>
        </header>

        <div className="bg-white rounded-3xl shadow-sm border border-[#e4d1c7] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#fffaf6] border-b border-[#e4d1c7] text-[#71402a] text-sm">
                <th className="p-5 font-bold">Producto</th>
                <th className="p-5 font-bold">Precio Base</th>
                <th className="p-5 font-bold">Imagen Principal</th>
                <th className="p-5 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="p-10 text-center text-[#c99598] font-bold">Cargando...</td></tr>
              ) : products.map((product) => (
                <tr key={product.id} className="border-b border-gray-50 hover:bg-[#fffaf6] transition-colors">
                  <td className="p-5">
                    <div className="font-extrabold text-[#71402a] text-lg">{product.name}</div>
                    <div className="text-sm text-gray-500 truncate w-64">{product.description}</div>
                  </td>
                  <td className="p-5 text-[#c99598] font-black">${product.base_price} MXN</td>
                  <td className="p-5">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 bg-cover bg-center border border-[#e4d1c7] shadow-sm" style={{ backgroundImage: `url(${product.card_image})` }}></div>
                  </td>
                  <td className="p-5 text-right space-x-4">
                    <button onClick={() => openEditModal(product)} className="text-[#c99598] font-bold hover:text-[#71402a]">Editar Info</button>
                    <button onClick={() => openFieldsModal(product)} className="text-[#c99598] font-bold hover:text-[#71402a]">Configurar Campos</button>
                    <button onClick={() => handleDeleteProduct(product.id)} className="text-red-400 font-bold hover:text-red-600">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MODAL: CREAR / EDITAR PRODUCTO */}
        {isProductModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl">
              <h2 className="text-2xl font-black text-[#71402a] mb-6">{editingProduct ? 'Modificar Producto' : 'Agregar Producto'}</h2>
              <form onSubmit={handleSaveProduct} className="flex flex-col gap-4">
                <label className="text-sm font-bold text-[#71402a] flex flex-col gap-1">Nombre
                  <input required value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} className="border border-[#e4d1c7] p-3 rounded-xl bg-gray-50 outline-none focus:border-[#c99598]" />
                </label>
                <label className="text-sm font-bold text-[#71402a] flex flex-col gap-1">Descripción
                  <textarea required value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} className="border border-[#e4d1c7] p-3 rounded-xl bg-gray-50 h-20 resize-none outline-none focus:border-[#c99598]" />
                </label>
                <label className="text-sm font-bold text-[#71402a] flex flex-col gap-1">Precio Base
                  <input required type="number" value={productForm.base_price} onChange={e => setProductForm({ ...productForm, base_price: Number(e.target.value) })} className="border border-[#e4d1c7] p-3 rounded-xl bg-gray-50 outline-none focus:border-[#c99598]" />
                </label>
                <label className="text-sm font-bold text-[#71402a] flex flex-col gap-1">Imagen de Tarjeta
                  <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} className="border border-[#e4d1c7] p-2 rounded-xl bg-gray-50 text-xs text-gray-500" />
                </label>
                <div className="flex gap-3 mt-4">
                  <button type="button" onClick={() => setIsProductModalOpen(false)} className="flex-1 py-3 bg-[#f4eae0] text-[#71402a] font-bold rounded-xl hover:bg-[#e4d1c7] transition-colors">Cancelar</button>
                  <button type="submit" disabled={isSubmitting} className="flex-1 py-3 bg-[#c99598] text-white font-bold rounded-xl hover:bg-[#71402a] transition-colors disabled:opacity-50">
                    {isSubmitting ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL COMPLETO: CONFIGURACIÓN DE CAMPOS DINÁMICOS Y OPCIONES */}
        {isFieldsModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-40 p-4 overflow-y-auto">
            <div className="bg-white p-8 rounded-3xl w-full max-w-4xl shadow-2xl grid grid-cols-1 md:grid-cols-2 gap-8 my-8 max-h-[90vh] overflow-y-auto">

              {/* COLUMNA IZQUIERDA: CAMPOS DEL PRODUCTO */}
              <div>
                <h2 className="text-2xl font-black text-[#71402a] mb-2">Campos para: <span className="text-[#c99598]">{selectedProduct?.name}</span></h2>
                <p className="text-sm text-gray-500 mb-6">Define qué preguntas/opciones verá el cliente al personalizar.</p>

                {/* Formulario para añadir nuevo campo */}
                <form onSubmit={handleAddField} className="bg-[#fffaf6] p-4 rounded-2xl border border-[#e4d1c7] flex flex-col gap-3 mb-6">
                  <div className="font-bold text-sm text-[#71402a]">Añadir Nuevo Campo</div>
                  <input required placeholder="Ej. Color de moño, Frase del globo" value={newField.label} onChange={e => setNewField({ ...newField, label: e.target.value })} className="border border-[#e4d1c7] p-2 text-sm rounded-xl bg-white outline-none focus:border-[#c99598]" />
                  <div className="grid grid-cols-2 gap-2">
                    <select value={newField.type} onChange={e => setNewField({ ...newField, type: e.target.value })} className="border border-[#e4d1c7] p-2 text-sm rounded-xl bg-white outline-none focus:border-[#c99598]">
                      <option value="text">Texto Corto (Input)</option>
                      <option value="select">Lista de opciones (Select)</option>
                      <option value="textarea">Texto Largo (Area)</option>
                      <option value="date">Fecha (Date)</option>
                    </select>
                    <input placeholder="Placeholder / Ej" value={newField.placeholder} onChange={e => setNewField({ ...newField, placeholder: e.target.value })} className="border border-[#e4d1c7] p-2 text-sm rounded-xl bg-white outline-none focus:border-[#c99598]" />
                  </div>
                  <button type="submit" className="bg-[#c99598] text-white font-bold text-xs py-2.5 rounded-xl hover:bg-[#71402a] transition-colors">+ Agregar Campo</button>
                </form>

                {/* Lista de campos actuales */}
                <div className="flex flex-col gap-2">
                  <div className="font-bold text-sm text-[#71402a]">Campos Configurados:</div>
                  {fields.map((field) => (
                    <div key={field.id} onClick={() => { if (field.type === 'select') { setSelectedField(field); fetchOptions(field.id); } }} className={`p-3 rounded-xl border flex justify-between items-center cursor-pointer transition-all ${selectedField?.id === field.id ? 'border-[#c99598] bg-[#fffaf6] shadow-sm' : 'border-[#e4d1c7] hover:bg-gray-50'}`}>
                      <div>
                        <div className="font-bold text-sm text-[#71402a]">{field.label}</div>
                        <div className="text-xs text-gray-500 capitalize">Tipo: {field.type} {field.type === 'select' && '👇 (Click para opciones)'}</div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteField(field.id); }} className="text-xs text-red-400 font-bold hover:text-red-600">Eliminar</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* COLUMNA DERECHA: OPCIONES DEL SELECT SELECCIONADO E IMÁGENES PREVIEW */}
              <div className="border-t md:border-t-0 md:border-l border-[#e4d1c7] md:pl-8">
                {selectedField ? (
                  <div>
                    <h3 className="text-xl font-bold text-[#71402a] mb-1">Opciones para: <span className="text-[#c99598]">{selectedField.label}</span></h3>
                    <p className="text-xs text-gray-500 mb-6">Agrega los valores de la lista y la foto que se cargará en el simulador.</p>

                    {/* Formulario Opción */}
                    <form onSubmit={handleAddFieldOption} className="bg-[#fffaf6] border border-[#e4d1c7] p-4 rounded-2xl flex flex-col gap-3 mb-6">
                      <div className="grid grid-cols-2 gap-2">
                        <label className="text-xs font-bold text-[#71402a] flex flex-col gap-1">
                          Nombre de la opción
                          <input required placeholder="Ej. Peluche Snoopy" value={newOptionLabel} onChange={e => setNewOptionLabel(e.target.value)} className="border border-[#e4d1c7] p-2 text-sm rounded-xl bg-white outline-none focus:border-[#c99598]" />
                        </label>
                        <label className="text-xs font-bold text-[#71402a] flex flex-col gap-1">
                          Precio Adicional (MXN)
                          <input type="number" required min="0" value={newOptionPrice} onChange={e => setNewOptionPrice(Number(e.target.value))} className="border border-[#e4d1c7] p-2 text-sm rounded-xl bg-white outline-none focus:border-[#c99598]" />
                        </label>
                      </div>

                      <label className="text-xs font-bold text-[#71402a] flex flex-col gap-1">
                        Foto Dinámica (Opcional)
                        <input type="file" accept="image/*" onChange={e => setOptionImageFile(e.target.files?.[0] || null)} className="border border-[#e4d1c7] p-1 rounded-lg bg-white text-xs text-gray-500" />
                      </label>
                      <button type="submit" className="bg-[#c99598] text-white font-bold text-xs py-2.5 rounded-xl hover:bg-[#71402a] transition-colors">Guardar Opción e Imagen</button>
                    </form>

                    {/* Lista Opciones */}
                    <div className="flex flex-col gap-2 max-h-[250px] overflow-y-auto pr-1">
                      {options.map((opt) => (
                        <div key={opt.id} className="p-2 bg-white border border-[#e4d1c7] rounded-xl flex items-center justify-between shadow-sm">
                          <div className="flex items-center gap-3">
                            {opt.preview_image ? (
                              <div className="w-12 h-12 rounded-lg bg-cover bg-center border border-[#e4d1c7]" style={{ backgroundImage: `url(${opt.preview_image})` }}></div>
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-[#fffaf6] border border-[#e4d1c7] flex items-center justify-center text-[10px] text-[#c99598] font-bold">Sin foto</div>
                            )}
                            <div>
                              <span className="text-sm font-extrabold text-[#71402a] block">{opt.label}</span>
                              {opt.additional_price > 0 && (
                                <span className="text-xs text-[#c99598] font-bold block">+${opt.additional_price} MXN</span>
                              )}
                            </div>
                          </div>
                          <button onClick={() => handleDeleteOption(opt.id)} className="text-xs text-red-400 font-bold hover:text-red-600">Borrar</button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#c99598]">
                    <div className="text-4xl mb-2">👈</div>
                    <div className="font-extrabold text-sm">Administra las opciones de tus listas</div>
                    <p className="text-xs max-w-[200px] mt-1 text-[#71402a]">Crea o selecciona un campo tipo "Lista de opciones (Select)" a la izquierda para configurar sus variantes e imágenes.</p>
                  </div>
                )}
              </div>

              {/* BOTON CERRAR MODAL GENERAL */}
              <div className="col-span-1 md:col-span-2 flex justify-end border-t border-[#e4d1c7] pt-4 mt-2">
                <button onClick={() => setIsFieldsModalOpen(false)} className="bg-[#71402a] hover:bg-[#c99598] text-white font-bold px-6 py-3 rounded-xl shadow-md text-sm transition-colors">
                  Finalizar Configuración
                </button>
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}