"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modales Principales
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isFieldsModalOpen, setIsFieldsModalOpen] = useState(false);

  // Estado para Crear / Editar Producto
  const [editingProduct, setEditingProduct] = useState<any | null>(null); // null = Crear, Objeto = Editar
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

  // --- 1. CARGAR DATOS ---
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

  useEffect(() => { fetchProducts(); }, []);

  // --- 2. LOGICA DE PRODUCTOS (CREAR / EDITAR / ELIMINAR) ---
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
      // MODIFICAR PRODUCTO
      const { error } = await supabase
        .from('products')
        .update({ name: productForm.name, description: productForm.description, base_price: productForm.base_price, card_image })
        .eq('id', editingProduct.id);
      if (error) alert('Error al modificar');
    } else {
      // CREAR PRODUCTO
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

  // --- 3. LÓGICA DE CAMPOS DINÁMICOS ---
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

  // --- 4. LÓGICA DE OPCIONES E IMÁGENES PREVIEW ---
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* SIDEBAR */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 p-6">
        <div className="font-black text-2xl tracking-tighter mb-10 text-gray-800">
          momenti<span className="text-pink-500">VA</span> <span className="text-sm font-normal text-gray-500">Admin</span>
        </div>
        <nav className="flex flex-col gap-4">
          <a href="#" className="font-bold text-blue-600 bg-blue-50 p-3 rounded-xl">📦 Productos</a>
        </nav>
      </aside>

      {/* TABLA PRINCIPAL */}
      <main className="flex-1 p-8 relative">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Catálogo</h1>
            <p className="text-gray-500 mt-2">Gestiona productos, campos de formulario y fotos cambiantes.</p>
          </div>
          <button onClick={openCreateModal} className="bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-3 px-6 rounded-full shadow-lg">
            + Nuevo Producto
          </button>
        </header>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm">
                <th className="p-5 font-semibold">Producto</th>
                <th className="p-5 font-semibold">Precio Base</th>
                <th className="p-5 font-semibold">Imagen Principal</th>
                <th className="p-5 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="p-10 text-center text-gray-500">Cargando...</td></tr>
              ) : products.map((product) => (
                <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="p-5">
                    <div className="font-bold text-gray-800">{product.name}</div>
                    <div className="text-xs text-gray-500 truncate w-64">{product.description}</div>
                  </td>
                  <td className="p-5 text-gray-600 font-medium">${product.base_price} MXN</td>
                  <td className="p-5">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 bg-cover bg-center border" style={{ backgroundImage: `url(${product.card_image})` }}></div>
                  </td>
                  <td className="p-5 text-right space-x-2">
                    <button onClick={() => openEditModal(product)} className="text-blue-500 font-bold hover:underline">Editar Info</button>
                    <button onClick={() => openFieldsModal(product)} className="text-purple-600 font-bold hover:underline">Configurar Campos</button>
                    <button onClick={() => handleDeleteProduct(product.id)} className="text-red-500 font-bold hover:underline">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MODAL: CREAR / EDITAR PRODUCTO */}
        {isProductModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl">
              <h2 className="text-2xl font-bold mb-6">{editingProduct ? 'Modificar Producto' : 'Agregar Producto'}</h2>
              <form onSubmit={handleSaveProduct} className="flex flex-col gap-4">
                <label className="text-sm font-bold text-gray-700 flex flex-col gap-1">Nombre
                  <input required value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} className="border p-3 rounded-xl bg-gray-50" />
                </label>
                <label className="text-sm font-bold text-gray-700 flex flex-col gap-1">Descripción
                  <textarea required value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} className="border p-3 rounded-xl bg-gray-50 h-20 resize-none" />
                </label>
                <label className="text-sm font-bold text-gray-700 flex flex-col gap-1">Precio Base
                  <input required type="number" value={productForm.base_price} onChange={e => setProductForm({ ...productForm, base_price: Number(e.target.value) })} className="border p-3 rounded-xl bg-gray-50" />
                </label>
                <label className="text-sm font-bold text-gray-700 flex flex-col gap-1">Imagen de Tarjeta
                  <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} className="border p-2 rounded-xl bg-gray-50 text-xs" />
                </label>
                <div className="flex gap-3 mt-4">
                  <button type="button" onClick={() => setIsProductModalOpen(false)} className="flex-1 py-3 bg-gray-100 font-bold rounded-xl">Cancelar</button>
                  <button type="submit" disabled={isSubmitting} className="flex-1 py-3 bg-pink-500 text-white font-bold rounded-xl disabled:opacity-50">
                    {isSubmitting ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL COMPLETO: CONFIGURACIÓN DE CAMPOS DINÁMICOS Y OPCIONES */}
        {isFieldsModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-40 p-4 overflow-y-auto">
            <div className="bg-white p-8 rounded-3xl w-full max-w-4xl shadow-2xl grid grid-cols-1 md:grid-cols-2 gap-8 my-8 max-h-[90vh] overflow-y-auto">

              {/* COLUMNA IZQUIERDA: CAMPOS DEL PRODUCTO */}
              <div>
                <h2 className="text-2xl font-black text-gray-900 mb-2">Campos para: {selectedProduct?.name}</h2>
                <p className="text-sm text-gray-500 mb-6">Define qué preguntas/opciones verá el cliente al personalizar.</p>

                {/* Formulario para añadir nuevo campo */}
                <form onSubmit={handleAddField} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col gap-3 mb-6">
                  <div className="font-bold text-sm text-gray-700">Añadir Nuevo Campo</div>
                  <input required placeholder="Ej. Color de moño, Frase del globo" value={newField.label} onChange={e => setNewField({ ...newField, label: e.target.value })} className="border p-2 text-sm rounded-xl bg-white" />
                  <div className="grid grid-cols-2 gap-2">
                    <select value={newField.type} onChange={e => setNewField({ ...newField, type: e.target.value })} className="border p-2 text-sm rounded-xl bg-white">
                      <option value="text">Texto Corto (Input)</option>
                      <option value="select">Lista de opciones (Select)</option>
                      <option value="textarea">Texto Largo (Area)</option>
                      <option value="date">Fecha (Date)</option>
                    </select>
                    <input placeholder="Placeholder / Ej" value={newField.placeholder} onChange={e => setNewField({ ...newField, placeholder: e.target.value })} className="border p-2 text-sm rounded-xl bg-white" />
                  </div>
                  <button type="submit" className="bg-purple-600 text-white font-bold text-xs py-2 rounded-xl hover:opacity-90">+ Agregar Campo</button>
                </form>

                {/* Lista de campos actuales */}
                <div className="flex flex-col gap-2">
                  <div className="font-bold text-sm text-gray-800">Campos Configurados:</div>
                  {fields.map((field) => (
                    <div key={field.id} onClick={() => { if (field.type === 'select') { setSelectedField(field); fetchOptions(field.id); } }} className={`p-3 rounded-xl border flex justify-between items-center cursor-pointer transition-all ${selectedField?.id === field.id ? 'border-purple-600 bg-purple-50/50 shadow-sm' : 'border-gray-200 hover:bg-gray-50'}`}>
                      <div>
                        <div className="font-bold text-sm text-gray-800">{field.label}</div>
                        <div className="text-xs text-gray-400 capitalize">Tipo: {field.type} {field.type === 'select' && '👇 (Click para opciones)'}</div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteField(field.id); }} className="text-xs text-red-500 font-bold hover:underline">Eliminar</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* COLUMNA DERECHA: OPCIONES DEL SELECT SELECCIONADO E IMÁGENES PREVIEW */}
              <div className="border-t md:border-t-0 md:border-l border-gray-200 md:pl-8">
                {selectedField ? (
                  <div>
                    <h3 className="text-xl font-bold text-purple-700 mb-1">Opciones para: {selectedField.label}</h3>
                    <p className="text-xs text-gray-400 mb-6">Agrega los valores de la lista y la foto que se cargará en el simulador.</p>

                    {/* Formulario Opción */}
                    <form onSubmit={handleAddFieldOption} className="bg-purple-50/40 border border-purple-100 p-4 rounded-2xl flex flex-col gap-3 mb-6">
                      <div className="grid grid-cols-2 gap-2">
                        <label className="text-xs font-bold text-gray-600 flex flex-col gap-1">
                          Nombre de la opción
                          <input required placeholder="Ej. Peluche Snoopy" value={newOptionLabel} onChange={e => setNewOptionLabel(e.target.value)} className="border p-2 text-sm rounded-xl bg-white outline-none focus:border-purple-500" />
                        </label>
                        <label className="text-xs font-bold text-gray-600 flex flex-col gap-1">
                          Precio Adicional (MXN)
                          <input type="number" required min="0" value={newOptionPrice} onChange={e => setNewOptionPrice(Number(e.target.value))} className="border p-2 text-sm rounded-xl bg-white outline-none focus:border-purple-500" />
                        </label>
                      </div>

                      <label className="text-xs font-bold text-gray-600 flex flex-col gap-1">
                        Foto de Vista Previa Dinámica (Preview)
                        <input type="file" accept="image/*" onChange={e => setOptionImageFile(e.target.files?.[0] || null)} className="border p-1 rounded-lg bg-white text-xs" />
                      </label>
                      <button type="submit" className="bg-purple-600 text-white font-bold text-xs py-2 rounded-xl hover:opacity-90">Guardar Opción e Imagen</button>
                    </form>

                    {/* Lista Opciones */}
                    <div className="flex flex-col gap-2 max-h-[250px] overflow-y-auto pr-1">
                      {options.map((opt) => (
                        <div key={opt.id} className="p-2 bg-white border border-gray-100 rounded-xl flex items-center justify-between shadow-xs">
                          <div className="flex items-center gap-3">
                            {opt.preview_image ? (
                              <div className="w-10 h-10 rounded-lg bg-cover bg-center border" style={{ backgroundImage: `url(${opt.preview_image})` }}></div>
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-gray-50 border flex items-center justify-center text-[10px] text-gray-300">Sin foto</div>
                            )}
                            <div>
                              <span className="text-sm font-semibold text-gray-700 block">{opt.label}</span>
                              {opt.additional_price > 0 && (
                                <span className="text-xs text-green-600 font-bold block">+${opt.additional_price} MXN</span>
                              )}
                            </div>
                          </div>
                          <button onClick={() => handleDeleteOption(opt.id)} className="text-xs text-red-500 font-medium hover:underline">Borrar</button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
                    <div className="text-4xl mb-2">👈</div>
                    <div className="font-semibold text-sm">Administra las opciones de tus listas</div>
                    <p className="text-xs max-w-[200px] mt-1">Crea o selecciona un campo tipo "Lista de opciones (Select)" a la izquierda para configurar sus variantes e imágenes.</p>
                  </div>
                )}
              </div>

              {/* BOTON CERRAR MODAL GENERAL */}
              <div className="col-span-1 md:col-span-2 flex justify-end border-t border-gray-100 pt-4 mt-2">
                <button onClick={() => setIsFieldsModalOpen(false)} className="bg-gray-900 text-white font-bold px-6 py-3 rounded-xl shadow-md text-sm">
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