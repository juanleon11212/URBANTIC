# URBANTIC frontend

Este directorio es el **Root Directory** del proyecto en Vercel.
Vercel compila la app con `npm run build` y publica `dist`.

En Vercel, configura `VITE_API_URL` para Production con la URL publica
del backend terminada en `/api`, por ejemplo:

```text
https://urbantic-api.onrender.com/api
```

Despues de cambiar esta variable, crea un despliegue nuevo desde GitHub:
Vite incorpora la URL durante la compilacion. El archivo `vercel.json`
permite abrir directamente rutas como `/login`.
