// Textos de la interfaz en español.
// Para añadir otro idioma: copiar este archivo (it.js, en.js), traducir los valores y registrarlo en i18n/index.js.
// Las variables van entre llaves: {n}, {titulo}, {nombre}.
// Los textos marcados con  // PROVISIONAL  no estaban en el documento: hay que revisarlos.

export default {
  comun: {
    atras: 'Atrás',
    cerrar: 'Cerrar',
    cancelar: 'Cancelar',
    guardar: 'Guardar',
    eliminar: 'Eliminar',
    siguiente: 'Siguiente',
    entrar: 'Entrar',
    continuar: 'Continuar',
    reintentar: 'Reintentar', // PROVISIONAL
    joyas: '{n} joyas',
    joya1: '1 joya' // PROVISIONAL (singular de «[N] joyas»)
  },

  ingreso: {
    claim: 'Todas tus referencias en el mismo sitio',
    yaTengo: 'Ya tengo un joyero',
    crear: 'Crear nuevo',
    logo: 'logo'
  },

  codigo: {
    titulo: 'Entra en tu joyero',
    subtitulo: 'Pega tu código de acceso. Solo lo necesitas una vez en cada dispositivo.',
    campo: 'Código de acceso',
    ejemplo: 'Ej. joy_AKfycbx…_7f3a9c',
    dondeTitulo: '¿Dónde encuentro mi código?',
    donde1: 'En tu Google Sheet de Joyero (está en tu Google Drive): menú <b>Joyero</b> > <b>Mostrar mi código</b> > <b>Copiar</b>.',
    donde2: 'Si ya usas Joyero en otro dispositivo: <b>Ajustes</b> > <b>Mi código de acceso</b> > <b>Copiar</b>.',
    noTienes: '¿No tienes joyero? Crea uno nuevo',
    noValido: 'Este código no es válido o tu joyero no responde. Revísalo e inténtalo de nuevo.',
    formato: 'Esto no parece un código de Joyero. Revísalo y pégalo de nuevo.'
  },

  tutorial: {
    progreso: '{paso} de {total}',
    yaTengo: 'Ya tengo un código',
    captura: 'screenshot del paso',
    crearCopia: 'Crear mi copia',
    pasos: [
      {
        titulo: 'Antes de empezar',
        texto: 'Necesitas una cuenta de Google y unos 5 minutos. Vas a crear tu propio joyero en tu Google Drive: tus joyas son tuyas y nadie puede verlas sin tu código.'
      },
      {
        titulo: 'Copia la plantilla',
        texto: 'Toca «Crear mi copia». En la página de Google, toca «Hacer una copia». Puedes ponerle el nombre que quieras.'
      },
      {
        titulo: 'Abre el script',
        texto: 'En tu copia, ve a Extensiones > Apps Script. Se abrirá una nueva pestaña con código: no lo modifiques.'
      },
      {
        titulo: 'Publica el script',
        texto: 'Arriba a la derecha, toca Implementar > Nueva implementación. Toca el engranaje junto a «Seleccionar tipo» y elige «Aplicación web». Configura «Ejecutar como: Yo» y «Quién tiene acceso: Cualquier usuario», y toca «Implementar».',
        nota: '«Cualquier usuario» solo sirve para que la web pueda comunicarse con tu Sheet; sin tu código, nadie puede leer ni escribir nada.'
      },
      {
        titulo: 'Autoriza',
        // Adaptado a la pantalla de permisos actual de Google (con casillas) y a la URL que hay que copiar.
        texto: 'Toca «Autorizar acceso» y elige tu cuenta. Toca «Configuración avanzada» y luego «Ir a [nombre del proyecto] (no seguro)». En la lista de permisos, marca «Seleccionar todo» y toca «Continuar». Al terminar, Google te mostrará la «URL de la aplicación web»: toca «Copiar».',
        nota: 'Google mostrará el aviso «Google no ha verificado esta aplicación»: es normal, porque el script lo acabas de crear tú al copiar la plantilla.'
      },
      {
        titulo: 'Copia tu código y entra',
        texto: 'Vuelve a la pestaña del Sheet y recarga la página. En el menú de arriba aparecerá «Joyero»: toca «Mostrar mi código», pega la URL que copiaste y toca «Mostrar mi código». Luego toca «Copiar», pega el código aquí abajo y toca «Entrar».',
        nota: 'Siempre podrás volver a verlo en Ajustes o en tu Google Sheet.'
      }
    ]
  },

  biblioteca: {
    titulo: 'Mi joyero',
    ajustes: 'Ajustes',
    buscar: 'Buscar por título, autor, nota o tema',
    buscarEtiqueta: 'Buscar',
    tipo: 'Tipo',
    tema: 'Tema',
    porOrganizar: 'Por organizar',
    limpiar: 'Limpiar filtros',
    anadir: 'Añadir',
    vacia: 'Todavía no tienes joyas. Toca + para guardar la primera.', // PROVISIONAL
    sinResultados: 'Ninguna joya coincide con tu búsqueda.' // PROVISIONAL
  },

  fijados: {
    titulo: 'Fijados',
    todas: 'Todas las joyas',
    fijar: 'Fijar',
    fijado: 'Fijado',
    editar: 'Editar fijados',
    terminar: 'Terminar edición', // PROVISIONAL (solo lector de pantalla)
    quitar: 'Quitar {nombre} de fijados', // PROVISIONAL (solo lector de pantalla)
    fijarJoya: 'Fijar joya',
    quitarJoya: 'Quitar de fijados',
    joyaFijada: 'Joya fijada',
    joyaQuitada: 'Joya quitada de fijados',
    filtroFijado: 'Filtro fijado',
    filtroQuitado: 'Filtro quitado de fijados'
  },

  menuMas: {
    anadir: 'Añadir joya',
    anadirSub: 'Pega un link',
    importar: 'Importar joyas',
    importarSub: 'Desde un archivo HTML de favoritos'
  },

  formulario: {
    tituloAnadir: 'Añadir joya',
    tituloEditar: 'Editar joya',
    link: 'Link *',
    titulo: 'Título *',
    descripcion: 'Descripción',
    autor: 'Autor',
    tipo: 'Tipo',
    temas: 'Temas',
    nota: 'Nota',
    nuevoTipo: '+ Nuevo tipo',
    nuevoTema: '+ Nuevo tema',
    eliminarJoya: 'Eliminar joya',
    duplicadoTitulo: 'Este link ya está en tu joyero',
    duplicadoTexto: 'Lo guardaste como «{titulo}». ¿Quieres guardarlo igualmente?',
    guardarIgualmente: 'Guardar igualmente',
    eliminarTitulo: '¿Eliminar esta joya?',
    eliminarTexto: 'No se puede deshacer.'
  },

  categoria: {
    usarEste: 'Usar este',
    crear: 'Crear «{texto}»',
    nuevaTipo: 'Nuevo tipo',
    nuevaTema: 'Nuevo tema',
    iconos: 'Icono',
    existe: 'Ya existe una categoría con este nombre',
    sinComas: 'El nombre no puede llevar comas.' // PROVISIONAL
  },

  detalle: {
    editar: 'Editar joya',
    abrir: 'Abrir link',
    tipo: 'Tipo',
    temas: 'Temas',
    nota: 'Nota'
  },

  importar: {
    titulo: 'Importar joyas',
    texto: 'Sube un archivo HTML de favoritos: el de tu navegador o uno que te haya pasado otra persona desde su Joyero.',
    comoExportar: 'Cómo exportar tus favoritos (desde el ordenador)',
    navegadores: [
      { nombre: 'Chrome', pasos: 'Menú ⋮ > Marcadores y listas > Administrador de marcadores > ⋮ > Exportar marcadores.' },
      { nombre: 'Safari', pasos: 'Archivo > Exportar los datos de navegación a un archivo > Marcadores. Se descarga un archivo .zip: ábrelo y sube el archivo HTML que hay dentro.' },
      { nombre: 'Firefox', pasos: 'Marcadores > Administrar marcadores > Importar y respaldar > Exportar marcadores a HTML.' }
    ],
    subir: 'Subir archivo',
    archivoNoValido: 'Este archivo no tiene favoritos que se puedan importar. Elige un archivo HTML de favoritos.', // PROVISIONAL
    encontradas: '{n} joyas encontradas',
    seleccionarTodo: 'Seleccionar todo',
    deseleccionarTodo: 'Deseleccionar todo',
    yaEsta: 'Ya está en tu joyero',
    sinCarpeta: 'sin carpeta', // del wireframe
    importarN: 'Importar {n} joyas',
    sugeridosTitulo: 'Temas sugeridos',
    sugeridosTexto: 'Estas carpetas de tus favoritos no coinciden con ningún tema. ¿Quieres crearlas como temas?',
    progreso: '{x} de {n}',
    progresoTexto: 'Guardando tus joyas y recuperando sus títulos. Puede tardar unos minutos: no cierres esta pantalla.',
    error: 'Se ha cortado la importación. Las joyas ya guardadas no se pierden: toca «Reintentar» para seguir.', // PROVISIONAL
    listo: '¡Listo!',
    importadas: '{n} joyas importadas',
    importadas1: '1 joya importada',
    saltadas: '{n} saltadas porque ya estaban en tu joyero',
    saltadas1: '1 saltada porque ya estaba en tu joyero',
    porOrganizar: '{n} en «Por organizar»',
    verJoyero: 'Ver mi joyero',
    salirAviso: 'La importación está en curso. Si sales ahora, se detendrá.' // PROVISIONAL
  },

  ajustes: {
    titulo: 'Ajustes',
    categorias: 'Categorías',
    categoriasSub: 'Tipos y temas',
    codigo: 'Mi código de acceso',
    mostrar: 'Mostrar',
    ocultar: 'Ocultar', // PROVISIONAL
    copiar: 'Copiar',
    copiado: 'Copiado', // PROVISIONAL
    codigoTexto: 'Úsalo para entrar desde otros dispositivos.',
    salir: 'Salir',
    salirTexto: 'Desconecta tu joyero de este dispositivo. Tus joyas no se borran.'
  },

  exportar: {
    titulo: 'Exportar tu joyero',
    sub: 'Archivo HTML de favoritos', // PROVISIONAL
    seleccionarTodas: 'Seleccionar todas',
    deseleccionarTodas: 'Deseleccionar todas',
    exportarN: 'Exportar {n} joyas',
    exportar1: 'Exportar 1 joya'
  },

  eliminar: {
    titulo: 'Eliminar joyero',
    texto: 'Se borrarán todas tus joyas, tus categorías y tus fijados, y tu código dejará de funcionar en todos tus dispositivos. Tu Google Sheet seguirá en tu Drive, vacío: puedes borrarlo tú.',
    aviso: 'Exporta tu joyero para no perder tus joyas. Puedes volver a subir el archivo a un joyero nuevo en cualquier momento.',
    exportar: 'Exportar tu joyero',
    boton: 'Eliminar joyero',
    dialogoTitulo: '¿Eliminar tu joyero?',
    dialogoTexto: 'Se borrarán tus {n} joyas. No se puede deshacer.',
    dialogoTexto1: 'Se borrará tu joya. No se puede deshacer.', // PROVISIONAL (singular)
    confirmar: 'Eliminar'
  },

  categorias: {
    titulo: 'Categorías',
    tipos: 'Tipos',
    temas: 'Temas',
    editar: 'Editar {nombre}',
    cerrarOpciones: 'Cerrar opciones',
    cambiarIcono: 'Cambiar icono',
    renombrar: 'Renombrar',
    eliminar: 'Eliminar',
    anadirTipo: '+ Añadir tipo',
    anadirTema: '+ Añadir tema',
    eliminarTitulo: '¿Eliminar «{nombre}»?',
    eliminarTexto: 'Se quitará de {n} joyas. No se puede deshacer.'
  },

  errores: {
    // PROVISIONAL: todos los textos de error se revisarán juntos.
    sinConexion: 'No hay conexión. Revisa tu internet e inténtalo de nuevo.',
    noResponde: 'Tu joyero no responde. Inténtalo de nuevo en unos segundos.',
    guardar: 'No se ha podido guardar. Tus datos siguen aquí: inténtalo de nuevo.',
    cargar: 'No se han podido cargar tus joyas.',
    generico: 'Algo ha fallado. Inténtalo de nuevo.',
    clave: 'Tu código ya no es válido. Sal y vuelve a entrar con tu código.'
  }
};
