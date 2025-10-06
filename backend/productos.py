from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from db_connection import get_connection
from fastapi.middleware.cors import CORSMiddleware
from datetime import date

app = FastAPI()

# Permitir llamadas desde el frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especifica el dominio exacto
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Producto(BaseModel):
    nombre: str
    categoria: str
    precio: float
    destacado: bool = False
    fecha: str
    stock: int
    imagen: str


class ProductoUpdate(BaseModel):
    nombre: Optional[str] = None
    categoria: Optional[str] = None
    precio: Optional[float] = None
    destacado: Optional[bool] = None
    fecha: Optional[str] = None
    stock: Optional[int] = None
    imagen: Optional[str] = None


class ItemCarrito(BaseModel):
    producto_id: int
    cantidad: int
    usuario_id: Optional[int] = None


# ==================== ENDPOINTS DE PRODUCTOS ====================

@app.get("/api/productos")
def listar_productos(
    categoria: Optional[str] = None,
    destacado: Optional[bool] = None,
    orden: Optional[str] = None
):
    """
    Lista todos los productos con filtros opcionales
    - categoria: filtrar por categoría
    - destacado: filtrar productos destacados (true/false)
    - orden: ordenar por precio-alto, precio-bajo, recientes
    """
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            sql = "SELECT * FROM productos WHERE 1=1"
            params = []
            
            if categoria:
                sql += " AND categoria = %s"
                params.append(categoria)
            
            if destacado is not None:
                sql += " AND destacado = %s"
                params.append(destacado)
            
            # Ordenamiento
            if orden == "precio-alto":
                sql += " ORDER BY precio DESC"
            elif orden == "precio-bajo":
                sql += " ORDER BY precio ASC"
            elif orden == "recientes":
                sql += " ORDER BY fecha DESC"
            else:
                sql += " ORDER BY id DESC"
            
            cursor.execute(sql, params)
            productos = cursor.fetchall()
        
        return {"productos": productos}
    
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=f"Error al obtener productos: {e}")
    
    finally:
        if conn:
            try:
                conn.close()
            except:
                pass


@app.get("/api/productos/{producto_id}")
def obtener_producto(producto_id: int):
    """Obtiene un producto específico por ID"""
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM productos WHERE id = %s", (producto_id,))
            producto = cursor.fetchone()
        
        if not producto:
            raise HTTPException(status_code=404, detail="Producto no encontrado")
        
        return {"producto": producto}
    
    except HTTPException:
        raise
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=f"Error al obtener el producto: {e}")
    
    finally:
        if conn:
            try:
                conn.close()
            except:
                pass


@app.post("/api/productos")
def crear_producto(producto: Producto):
    """Crea un nuevo producto"""
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            sql = """
                INSERT INTO productos (
                    nombre, categoria, precio, destacado, fecha, stock, imagen
                ) VALUES (%s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(sql, (
                producto.nombre,
                producto.categoria,
                producto.precio,
                producto.destacado,
                producto.fecha,
                producto.stock,
                producto.imagen
            ))
            conn.commit()
            
            nuevo_id = cursor.lastrowid
            cursor.execute("SELECT * FROM productos WHERE id = %s", (nuevo_id,))
            nuevo_producto = cursor.fetchone()
        
        return {
            "mensaje": "Producto creado correctamente",
            "producto": nuevo_producto
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al crear el producto: {e}")
    
    finally:
        if conn:
            try:
                conn.close()
            except:
                pass


@app.put("/api/productos/{producto_id}")
def actualizar_producto(producto_id: int, producto: ProductoUpdate):
    """Actualiza un producto existente"""
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            # Verificar si el producto existe
            cursor.execute("SELECT * FROM productos WHERE id = %s", (producto_id,))
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="Producto no encontrado")
            
            # Construir SQL dinámicamente solo con campos no nulos
            campos = []
            valores = []
            
            if producto.nombre is not None:
                campos.append("nombre = %s")
                valores.append(producto.nombre)
            if producto.categoria is not None:
                campos.append("categoria = %s")
                valores.append(producto.categoria)
            if producto.precio is not None:
                campos.append("precio = %s")
                valores.append(producto.precio)
            if producto.destacado is not None:
                campos.append("destacado = %s")
                valores.append(producto.destacado)
            if producto.fecha is not None:
                campos.append("fecha = %s")
                valores.append(producto.fecha)
            if producto.stock is not None:
                campos.append("stock = %s")
                valores.append(producto.stock)
            if producto.imagen is not None:
                campos.append("imagen = %s")
                valores.append(producto.imagen)
            
            if not campos:
                raise HTTPException(status_code=400, detail="No hay campos para actualizar")
            
            valores.append(producto_id)
            sql = f"UPDATE productos SET {', '.join(campos)} WHERE id = %s"
            cursor.execute(sql, valores)
            conn.commit()
            
            cursor.execute("SELECT * FROM productos WHERE id = %s", (producto_id,))
            producto_actualizado = cursor.fetchone()
        
        return {
            "mensaje": "Producto actualizado correctamente",
            "producto": producto_actualizado
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al actualizar el producto: {e}")
    
    finally:
        if conn:
            try:
                conn.close()
            except:
                pass


@app.delete("/api/productos/{producto_id}")
def eliminar_producto(producto_id: int):
    """Elimina un producto"""
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM productos WHERE id = %s", (producto_id,))
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="Producto no encontrado")
            
            cursor.execute("DELETE FROM productos WHERE id = %s", (producto_id,))
            conn.commit()
        
        return {"mensaje": "Producto eliminado correctamente"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al eliminar el producto: {e}")
    
    finally:
        if conn:
            try:
                conn.close()
            except:
                pass


# ==================== ENDPOINTS DE CARRITO ====================

@app.get("/api/carrito/{usuario_id}")
def obtener_carrito(usuario_id: int):
    """Obtiene el carrito de un usuario específico"""
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            sql = """
                SELECT c.*, p.nombre, p.precio, p.imagen, p.stock
                FROM carrito c
                INNER JOIN productos p ON c.producto_id = p.id
                WHERE c.usuario_id = %s
            """
            cursor.execute(sql, (usuario_id,))
            items = cursor.fetchall()
        
        return {"carrito": items}
    
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=f"Error al obtener el carrito: {e}")
    
    finally:
        if conn:
            try:
                conn.close()
            except:
                pass


@app.post("/api/carrito")
def agregar_al_carrito(item: ItemCarrito):
    """Agrega o actualiza un producto en el carrito"""
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            # Verificar stock disponible
            cursor.execute("SELECT stock FROM productos WHERE id = %s", (item.producto_id,))
            producto = cursor.fetchone()
            
            if not producto:
                raise HTTPException(status_code=404, detail="Producto no encontrado")
            
            # Verificar si ya existe en el carrito
            cursor.execute(
                "SELECT * FROM carrito WHERE producto_id = %s AND usuario_id = %s",
                (item.producto_id, item.usuario_id)
            )
            item_existente = cursor.fetchone()
            
            if item_existente:
                nueva_cantidad = item_existente['cantidad'] + item.cantidad
                if nueva_cantidad > producto['stock']:
                    raise HTTPException(status_code=400, detail="No hay suficiente stock disponible")
                
                cursor.execute(
                    "UPDATE carrito SET cantidad = %s WHERE id = %s",
                    (nueva_cantidad, item_existente['id'])
                )
            else:
                if item.cantidad > producto['stock']:
                    raise HTTPException(status_code=400, detail="No hay suficiente stock disponible")
                
                cursor.execute(
                    "INSERT INTO carrito (producto_id, cantidad, usuario_id) VALUES (%s, %s, %s)",
                    (item.producto_id, item.cantidad, item.usuario_id)
                )
            
            conn.commit()
        
        return {"mensaje": "Producto agregado al carrito correctamente"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al agregar al carrito: {e}")
    
    finally:
        if conn:
            try:
                conn.close()
            except:
                pass


@app.put("/api/carrito/{carrito_id}")
def actualizar_cantidad_carrito(carrito_id: int, cantidad: int):
    """Actualiza la cantidad de un item en el carrito"""
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            # Obtener el item del carrito
            cursor.execute("SELECT * FROM carrito WHERE id = %s", (carrito_id,))
            item = cursor.fetchone()
            
            if not item:
                raise HTTPException(status_code=404, detail="Item no encontrado en el carrito")
            
            # Verificar stock
            cursor.execute("SELECT stock FROM productos WHERE id = %s", (item['producto_id'],))
            producto = cursor.fetchone()
            
            if cantidad > producto['stock']:
                raise HTTPException(status_code=400, detail="No hay suficiente stock disponible")
            
            cursor.execute("UPDATE carrito SET cantidad = %s WHERE id = %s", (cantidad, carrito_id))
            conn.commit()
        
        return {"mensaje": "Cantidad actualizada correctamente"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al actualizar la cantidad: {e}")
    
    finally:
        if conn:
            try:
                conn.close()
            except:
                pass


@app.delete("/api/carrito/{carrito_id}")
def eliminar_del_carrito(carrito_id: int):
    """Elimina un producto del carrito"""
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM carrito WHERE id = %s", (carrito_id,))
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="Item no encontrado en el carrito")
            
            cursor.execute("DELETE FROM carrito WHERE id = %s", (carrito_id,))
            conn.commit()
        
        return {"mensaje": "Producto eliminado del carrito correctamente"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al eliminar del carrito: {e}")
    
    finally:
        if conn:
            try:
                conn.close()
            except:
                pass


@app.delete("/api/carrito/usuario/{usuario_id}")
def vaciar_carrito(usuario_id: int):
    """Vacía todo el carrito de un usuario (para después de finalizar compra)"""
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM carrito WHERE usuario_id = %s", (usuario_id,))
            conn.commit()
        
        return {"mensaje": "Carrito vaciado correctamente"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al vaciar el carrito: {e}")
    
    finally:
        if conn:
            try:
                conn.close()
            except:
                pass