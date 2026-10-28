/* NoNotes-Erweiterung «Szenen-Hintergründe»: setzt hinter der Mindmap und dem Editor ein Hintergrundbild, das sich mit
   der gewählten Notiz ändert, je nach Tag.

   - Es gilt ein STANDARD-Bild (z. B. eine Taverne).
   - Wählst du in der Mindmap eine Notiz aus (oder öffnest sie im Editor, Bearbeiten wie Vorschau), prüft die
     Erweiterung zuerst die Tags dieser Notiz, dann die ihrer Eltern, dann deren Eltern usw. Das erste Tag, das in
     HINTERGRUENDE vorkommt, bestimmt das Bild. Alle Unternotizen erben es also, solange nichts anderes über ein Tag
     gesetzt wurde. Bei mehreren passenden Tags derselben Notiz gewinnt der Eintrag weiter oben in der Liste.
   - Ohne Auswahl und bei der Wurzel gilt das Standard-Bild.
   Änderungen an der Konfiguration wirken nach dem Neuladen der Seite. */

/* ---- Konfiguration ------------------------------------------------------------------------------------------- */
// Bilder: Pfad relativ zu dieser Skriptdatei (egal, in welchem Unterordner von plugins/ sie liegt), oder eine volle
// Adresse (https://…, data:…). SVG, PNG, JPG, WebP.
// null als Bild heisst: kein Hintergrund (das normale Design der App).
const STANDARD = null;
const HINTERGRUENDE = [
  // Fantasy und Natur
  { tag: 'wald',        bild: 'hintergruende/wald.svg' },
  { tag: 'hoehle',      bild: 'hintergruende/hoehle.svg' },
  { tag: 'burg',        bild: 'hintergruende/burg.svg' },
  { tag: 'altstadt',    bild: 'hintergruende/altstadt.svg' },
  { tag: 'bibliothek',  bild: 'hintergruende/bibliothek.svg' },
  { tag: 'berg',        bild: 'hintergruende/berge.svg' },
  { tag: 'strand',      bild: 'hintergruende/strand.svg' },
  { tag: 'unterwasser', bild: 'hintergruende/unterwasser.svg' },
  { tag: 'garten',      bild: 'hintergruende/gewaechshaus.svg' },
  { tag: 'taverne',      bild: 'hintergruende/taverne.svg' },
  // Arbeit und Alltag
  { tag: 'buero',       bild: 'hintergruende/buero.svg' },
  { tag: 'meeting',     bild: 'hintergruende/meetingraum.svg' },
  { tag: 'cafe',        bild: 'hintergruende/cafe.svg' },
  { tag: 'labor',       bild: 'hintergruende/labor.svg' },
  // Stadt und Zukunft
  { tag: 'stadt',       bild: 'hintergruende/stadtzentrum.svg' },
  { tag: 'zukunft',     bild: 'hintergruende/zukunftsstadt.svg' },
  { tag: 'cyberpunk',   bild: 'hintergruende/cyberpunk.svg' },
  { tag: 'raumschiff',  bild: 'hintergruende/raumschiff.svg' },
  { tag: 'weltall',     bild: 'hintergruende/weltall.svg' },
  { tag: 'neutral', bild: null },   // kein Hintergrund (das normale Design der App)
];
const VERBLASSEN = 0.30;       // 0 bis 0.9: wie stark die Farbe des Designs über das Bild gelegt wird (Lesbarkeit)
const EDITOR_KARTE = 0.80;     // 0 bis 1: Deckkraft der Karte hinter Titel und Text im Editor (1 = Bild nicht sichtbar)
const UEBERBLENDEN_MS = 500;   // Dauer des Überblendens beim Wechsel
/* --------------------------------------------------------------------------------------------------------------- */

// Ordner dieser Skriptdatei, solange das Skript läuft (später ist document.currentScript leer); Bildpfade gelten dazu relativ
const SZENEN_ORDNER = (document.currentScript && document.currentScript.src) ? document.currentScript.src.replace(/[^/]*$/, '') : '';

/* ---- Texte je Sprache --------------------------------------------------------------------------------------
   Schlüssel klein: 'de', 'de-de', 'en', 'fr', 'it', 'es', 'es-mx', 'pt', 'pt-br'. Gewählt wird die genaue Sprache der Oberfläche,
   dann die Sprache vor dem Bindestrich, dann Englisch. Die weiteren Sprachen stammen aus .l10n/scene-backgrounds/ (node .l10n/apply.cjs). */
const SB_TEXTE = {
  de: {
    name: 'Szenen-Hintergründe',
    description: 'Hintergrundbild für Mindmap und Editor, je nach Tag der gewählten Notiz (erbt an Unternotizen).',
    help: `Setzt hinter Mindmap und Editor ein **Hintergrundbild**, das mit der gewählten Notiz wechselt.

- Es gilt ein **Standard-Bild** (z. B. eine Taverne).
- Wählst du eine Notiz aus oder öffnest sie (Bearbeiten, Geteilt, Vorschau), prüft die Erweiterung zuerst ihre Tags, dann die der Elternnotizen nach oben. Das erste Tag aus \`HINTERGRUENDE\` bestimmt das Bild. **Unternotizen erben es**, solange kein eigenes Tag etwas anderes setzt.
- Bei mehreren passenden Tags derselben Notiz gewinnt der Eintrag weiter oben in der Liste. \`bild: null\` schaltet den Hintergrund ab.

#### Mitgelieferte Szenen
Ohne passendes Tag gilt die **Taverne**.

- \`wald\`: Wald
- \`hoehle\`: Höhle mit Kristallen
- \`burg\`: Burg / Thronsaal
- \`altstadt\`: Altstadt
- \`bibliothek\`: Bibliothek / Arbeitszimmer
- \`berg\`: Berggipfel / Alpen
- \`strand\`: Strand bei Sonnenuntergang
- \`unterwasser\`: Unterwasserwelt
- \`garten\`: Gewächshaus / Garten
- \`buero\`: Büro
- \`meeting\`: Corporate Meeting Room
- \`cafe\`: Café / Küche
- \`labor\`: Labor / Werkstatt
- \`stadt\`: Modernes Stadtzentrum
- \`zukunft\`: Futuristisches Stadtzentrum
- \`cyberpunk\`: Cyberpunk-Gasse
- \`raumschiff\`: Raumschiff-Brücke
- \`weltall\`: Weltall

#### Anpassen
Oben in \`scene-backgrounds.js\`: \`STANDARD\`, \`HINTERGRUENDE\` (Tag → Bild), \`VERBLASSEN\` (Schleier für die Lesbarkeit), \`EDITOR_KARTE\` (Karte hinter dem Text) und \`UEBERBLENDEN_MS\`. Eigene Bilder (SVG, PNG, JPG, WebP) kommen in den Ordner \`hintergruende/\`.`,
  },
  en: {
    name: 'Scene backgrounds',
    description: 'Background image for the mind map and the editor, depending on the tag of the selected note (inherited by subnotes).',
    help: `Puts a **background image** behind the mind map and the editor that changes with the selected note.

- A **default image** applies (e.g. a tavern).
- When you select or open a note (edit, split, preview), the extension checks its tags first, then those of its parents upwards. The first tag found in \`HINTERGRUENDE\` decides the image. **Subnotes inherit it** unless a tag of their own sets something else.
- With several matching tags on the same note, the entry higher up in the list wins. \`bild: null\` turns the background off.

#### Included scenes
Without a matching tag the **tavern** applies.

- \`wald\`: Forest
- \`hoehle\`: Crystal cave
- \`burg\`: Castle / throne room
- \`altstadt\`: Old town
- \`bibliothek\`: Library / study
- \`berg\`: Mountain peaks / Alps
- \`strand\`: Beach at sunset
- \`unterwasser\`: Underwater world
- \`garten\`: Greenhouse / garden
- \`buero\`: Office
- \`meeting\`: Corporate meeting room
- \`cafe\`: Café / kitchen
- \`labor\`: Lab / workshop
- \`stadt\`: Modern city centre
- \`zukunft\`: Futuristic city centre
- \`cyberpunk\`: Cyberpunk alley
- \`raumschiff\`: Starship bridge
- \`weltall\`: Outer space

#### Customising
At the top of \`scene-backgrounds.js\`: \`STANDARD\`, \`HINTERGRUENDE\` (tag → image), \`VERBLASSEN\` (veil for legibility), \`EDITOR_KARTE\` (card behind the text) and \`UEBERBLENDEN_MS\`. Put your own images (SVG, PNG, JPG, WebP) in the \`hintergruende/\` folder.`,
  },
  /* <uebersetzungen> */
  'de-de': {
    name: "Szenen-Hintergründe",
    description: "Hintergrundbild für Mindmap und Editor, je nach Tag der gewählten Notiz (erbt an Unternotizen).",
    help: `Setzt hinter Mindmap und Editor ein **Hintergrundbild**, das mit der gewählten Notiz wechselt.

- Es gilt ein **Standard-Bild** (z. B. eine Taverne).
- Wählst du eine Notiz aus oder öffnest sie (Bearbeiten, Geteilt, Vorschau), prüft die Erweiterung zuerst ihre Tags, dann die der Elternnotizen nach oben. Das erste Tag aus \`HINTERGRUENDE\` bestimmt das Bild. **Unternotizen erben es**, solange kein eigenes Tag etwas anderes setzt.
- Bei mehreren passenden Tags derselben Notiz gewinnt der Eintrag weiter oben in der Liste. \`bild: null\` schaltet den Hintergrund ab.

#### Mitgelieferte Szenen
Ohne passendes Tag gilt die **Taverne**.

- \`wald\`: Wald
- \`hoehle\`: Höhle mit Kristallen
- \`burg\`: Burg / Thronsaal
- \`altstadt\`: Altstadt
- \`bibliothek\`: Bibliothek / Arbeitszimmer
- \`berg\`: Berggipfel / Alpen
- \`strand\`: Strand bei Sonnenuntergang
- \`unterwasser\`: Unterwasserwelt
- \`garten\`: Gewächshaus / Garten
- \`buero\`: Büro
- \`meeting\`: Corporate Meeting Room
- \`cafe\`: Café / Küche
- \`labor\`: Labor / Werkstatt
- \`stadt\`: Modernes Stadtzentrum
- \`zukunft\`: Futuristisches Stadtzentrum
- \`cyberpunk\`: Cyberpunk-Gasse
- \`raumschiff\`: Raumschiff-Brücke
- \`weltall\`: Weltall

#### Anpassen
Oben in \`scene-backgrounds.js\`: \`STANDARD\`, \`HINTERGRUENDE\` (Tag → Bild), \`VERBLASSEN\` (Schleier für die Lesbarkeit), \`EDITOR_KARTE\` (Karte hinter dem Text) und \`UEBERBLENDEN_MS\`. Eigene Bilder (SVG, PNG, JPG, WebP) kommen in den Ordner \`hintergruende/\`.`,
  },
  'fr': {
    name: "Arrière-plans de scène",
    description: "Image d’arrière-plan pour la carte mentale et l’éditeur, selon l’étiquette de la note sélectionnée (héritée par les sous-notes).",
    help: `Place derrière la carte mentale et l’éditeur une **image d’arrière-plan** qui change avec la note sélectionnée.

- Une **image par défaut** s’applique (p. ex. une taverne).
- Lorsque vous sélectionnez ou ouvrez une note (Édition, Côte à côte, Aperçu), l’extension examine d’abord ses étiquettes, puis celles des notes parentes en remontant. La première étiquette figurant dans \`HINTERGRUENDE\` détermine l’image. **Les sous-notes en héritent**, tant qu’aucune étiquette propre n’impose autre chose.
- Si une même note a plusieurs étiquettes correspondantes, l’entrée placée plus haut dans la liste l’emporte. \`bild: null\` désactive l’arrière-plan.

#### Scènes fournies
Sans étiquette correspondante, c’est la **taverne** qui s’applique.

- \`wald\` : Forêt
- \`hoehle\` : Grotte de cristaux
- \`burg\` : Château / salle du trône
- \`altstadt\` : Vieille ville
- \`bibliothek\` : Bibliothèque / cabinet de travail
- \`berg\` : Sommets / Alpes
- \`strand\` : Plage au coucher du soleil
- \`unterwasser\` : Monde sous-marin
- \`garten\` : Serre / jardin
- \`buero\` : Bureau
- \`meeting\` : Salle de réunion d’entreprise
- \`cafe\` : Café / cuisine
- \`labor\` : Laboratoire / atelier
- \`stadt\` : Centre-ville moderne
- \`zukunft\` : Centre-ville futuriste
- \`cyberpunk\` : Ruelle cyberpunk
- \`raumschiff\` : Passerelle de vaisseau spatial
- \`weltall\` : Espace intersidéral

#### Personnaliser
En haut de \`scene-backgrounds.js\` : \`STANDARD\`, \`HINTERGRUENDE\` (étiquette → image), \`VERBLASSEN\` (voile pour la lisibilité), \`EDITOR_KARTE\` (carte derrière le texte) et \`UEBERBLENDEN_MS\`. Placez vos propres images (SVG, PNG, JPG, WebP) dans le dossier \`hintergruende/\`.`,
  },
  'it': {
    name: "Sfondi di scena",
    description: "Immagine di sfondo per la mappa mentale e l’editor, in base al tag della nota selezionata (ereditata dalle sottonote).",
    help: `Mette dietro la mappa mentale e l’editor un’**immagine di sfondo** che cambia con la nota selezionata.

- Vale un’**immagine predefinita** (ad es. una taverna).
- Quando selezioni o apri una nota (Modifica, Diviso, Anteprima), l’estensione controlla prima i suoi tag, poi quelli delle note superiori, risalendo l’albero. Il primo tag presente in \`HINTERGRUENDE\` determina l’immagine. **Le sottonote la ereditano**, finché un loro tag non imposta altro.
- Con più tag corrispondenti sulla stessa nota prevale la voce più in alto nell’elenco. \`bild: null\` disattiva lo sfondo.

#### Scene incluse
Senza un tag corrispondente vale la **taverna**.

- \`wald\`: Bosco
- \`hoehle\`: Grotta con cristalli
- \`burg\`: Castello / sala del trono
- \`altstadt\`: Centro storico
- \`bibliothek\`: Biblioteca / studio
- \`berg\`: Vette / Alpi
- \`strand\`: Spiaggia al tramonto
- \`unterwasser\`: Mondo sottomarino
- \`garten\`: Serra / giardino
- \`buero\`: Ufficio
- \`meeting\`: Sala riunioni aziendale
- \`cafe\`: Caffè / cucina
- \`labor\`: Laboratorio / officina
- \`stadt\`: Centro città moderno
- \`zukunft\`: Centro città futuristico
- \`cyberpunk\`: Vicolo cyberpunk
- \`raumschiff\`: Ponte di comando di un’astronave
- \`weltall\`: Spazio cosmico

#### Personalizzare
In cima a \`scene-backgrounds.js\`: \`STANDARD\`, \`HINTERGRUENDE\` (tag → immagine), \`VERBLASSEN\` (velo per la leggibilità), \`EDITOR_KARTE\` (riquadro dietro il testo) e \`UEBERBLENDEN_MS\`. Le tue immagini (SVG, PNG, JPG, WebP) vanno nella cartella \`hintergruende/\`.`,
  },
  'es': {
    name: "Fondos de escena",
    description: "Imagen de fondo para el mapa mental y el editor según la etiqueta de la nota seleccionada (la heredan las subnotas).",
    help: `Coloca detrás del mapa mental y del editor una **imagen de fondo** que cambia con la nota seleccionada.

- Se aplica una **imagen predeterminada** (por ejemplo, una taberna).
- Cuando seleccionas o abres una nota (Editar, Dividida, Vista previa), la extensión comprueba primero sus etiquetas y después las de las notas padre, hacia arriba. La primera etiqueta que esté en \`HINTERGRUENDE\` decide la imagen. **Las subnotas la heredan**, salvo que una etiqueta propia indique otra cosa.
- Si una misma nota tiene varias etiquetas que coinciden, gana la entrada que está más arriba en la lista. \`bild: null\` desactiva el fondo.

#### Escenas incluidas
Sin una etiqueta que coincida, se aplica la **taberna**.

- \`wald\`: Bosque
- \`hoehle\`: Cueva de cristales
- \`burg\`: Castillo / salón del trono
- \`altstadt\`: Casco antiguo
- \`bibliothek\`: Biblioteca / estudio
- \`berg\`: Cumbres / Alpes
- \`strand\`: Playa al atardecer
- \`unterwasser\`: Mundo submarino
- \`garten\`: Invernadero / jardín
- \`buero\`: Oficina
- \`meeting\`: Sala de reuniones corporativa
- \`cafe\`: Cafetería / cocina
- \`labor\`: Laboratorio / taller
- \`stadt\`: Centro urbano moderno
- \`zukunft\`: Centro urbano futurista
- \`cyberpunk\`: Callejón cyberpunk
- \`raumschiff\`: Puente de mando de una nave espacial
- \`weltall\`: Espacio exterior

#### Personalizar
Al principio de \`scene-backgrounds.js\`: \`STANDARD\`, \`HINTERGRUENDE\` (etiqueta → imagen), \`VERBLASSEN\` (velo para facilitar la lectura), \`EDITOR_KARTE\` (tarjeta detrás del texto) y \`UEBERBLENDEN_MS\`. Las imágenes propias (SVG, PNG, JPG, WebP) van en la carpeta \`hintergruende/\`.`,
  },
  'es-mx': {
    name: "Fondos de escena",
    description: "Imagen de fondo para el mapa mental y el editor, según la etiqueta de la nota seleccionada (la heredan las subnotas).",
    help: `Pone detrás del mapa mental y del editor una **imagen de fondo** que cambia con la nota seleccionada.

- Se aplica una **imagen predeterminada** (p. ej. una taberna).
- Cuando seleccionas o abres una nota (Editar, Dividida, Vista previa), la extensión revisa primero sus etiquetas y luego las de sus notas superiores, hacia arriba. La primera etiqueta que aparece en \`HINTERGRUENDE\` decide la imagen. **Las subnotas la heredan**, mientras ninguna etiqueta propia indique otra cosa.
- Si varias etiquetas de la misma nota coinciden, gana la entrada que está más arriba en la lista. \`bild: null\` desactiva el fondo.

#### Escenas incluidas
Sin una etiqueta que coincida, se aplica la **taberna**.

- \`wald\`: Bosque
- \`hoehle\`: Cueva de cristales
- \`burg\`: Castillo / sala del trono
- \`altstadt\`: Centro histórico
- \`bibliothek\`: Biblioteca / estudio
- \`berg\`: Cumbres / Alpes
- \`strand\`: Playa al atardecer
- \`unterwasser\`: Mundo submarino
- \`garten\`: Invernadero / jardín
- \`buero\`: Oficina
- \`meeting\`: Sala de juntas corporativa
- \`cafe\`: Café / cocina
- \`labor\`: Laboratorio / taller
- \`stadt\`: Centro de una ciudad moderna
- \`zukunft\`: Centro de una ciudad futurista
- \`cyberpunk\`: Callejón cyberpunk
- \`raumschiff\`: Puente de una nave espacial
- \`weltall\`: Espacio exterior

#### Personalizar
Al principio de \`scene-backgrounds.js\`: \`STANDARD\`, \`HINTERGRUENDE\` (etiqueta → imagen), \`VERBLASSEN\` (velo para la legibilidad), \`EDITOR_KARTE\` (tarjeta detrás del texto) y \`UEBERBLENDEN_MS\`. Las imágenes propias (SVG, PNG, JPG, WebP) van en la carpeta \`hintergruende/\`.`,
  },
  'pt': {
    name: "Fundos de cena",
    description: "Imagem de fundo para o mapa mental e o editor, conforme a etiqueta da nota selecionada (herdada pelas subnotas).",
    help: `Coloca por trás do mapa mental e do editor uma **imagem de fundo** que muda com a nota selecionada.

- Aplica-se uma **imagem predefinida** (por exemplo, uma taberna).
- Quando seleciona ou abre uma nota (Editar, Dividida, Pré-visualização), a extensão verifica primeiro as etiquetas dela e depois as das notas superiores, subindo na árvore. A primeira etiqueta de \`HINTERGRUENDE\` determina a imagem. **As subnotas herdam-na**, desde que nenhuma etiqueta própria defina outra coisa.
- Com várias etiquetas correspondentes na mesma nota, prevalece a entrada mais acima na lista. \`bild: null\` desativa o fundo.

#### Cenas incluídas
Sem etiqueta correspondente, aplica-se a **taberna**.

- \`wald\`: Floresta
- \`hoehle\`: Gruta de cristais
- \`burg\`: Castelo / sala do trono
- \`altstadt\`: Centro histórico
- \`bibliothek\`: Biblioteca / gabinete
- \`berg\`: Picos de montanha / Alpes
- \`strand\`: Praia ao pôr do sol
- \`unterwasser\`: Mundo subaquático
- \`garten\`: Estufa / jardim
- \`buero\`: Escritório
- \`meeting\`: Sala de reuniões empresarial
- \`cafe\`: Café / cozinha
- \`labor\`: Laboratório / oficina
- \`stadt\`: Centro de cidade moderno
- \`zukunft\`: Centro de cidade futurista
- \`cyberpunk\`: Beco cyberpunk
- \`raumschiff\`: Ponte de nave espacial
- \`weltall\`: Espaço sideral

#### Personalizar
No topo de \`scene-backgrounds.js\`: \`STANDARD\`, \`HINTERGRUENDE\` (etiqueta → imagem), \`VERBLASSEN\` (véu para a legibilidade), \`EDITOR_KARTE\` (cartão por trás do texto) e \`UEBERBLENDEN_MS\`. As imagens próprias (SVG, PNG, JPG, WebP) vão para a pasta \`hintergruende/\`.`,
  },
  'pt-br': {
    name: "Fundos de cenário",
    description: "Imagem de fundo para o mapa mental e o editor, conforme a tag da nota selecionada (herdada pelas subnotas).",
    help: `Coloca atrás do mapa mental e do editor uma **imagem de fundo** que muda com a nota selecionada.

- Vale uma **imagem padrão** (por exemplo, uma taverna).
- Quando você seleciona ou abre uma nota (Editar, Lado a lado, Prévia), a extensão verifica primeiro as tags dela e depois as das notas pai, subindo na árvore. A primeira tag encontrada em \`HINTERGRUENDE\` define a imagem. **As subnotas a herdam**, a menos que uma tag própria defina outra coisa.
- Se várias tags da mesma nota corresponderem, vence o item que está mais acima na lista. \`bild: null\` desativa o fundo.

#### Cenários incluídos
Sem uma tag correspondente, vale a **taverna**.

- \`wald\`: floresta
- \`hoehle\`: caverna de cristais
- \`burg\`: castelo / sala do trono
- \`altstadt\`: centro histórico
- \`bibliothek\`: biblioteca / escritório em casa
- \`berg\`: picos de montanha / Alpes
- \`strand\`: praia ao pôr do sol
- \`unterwasser\`: mundo submarino
- \`garten\`: estufa / jardim
- \`buero\`: escritório
- \`meeting\`: sala de reuniões corporativa
- \`cafe\`: café / cozinha
- \`labor\`: laboratório / oficina
- \`stadt\`: centro urbano moderno
- \`zukunft\`: centro urbano futurista
- \`cyberpunk\`: beco cyberpunk
- \`raumschiff\`: ponte de comando de nave espacial
- \`weltall\`: espaço sideral

#### Personalizar
No início de \`scene-backgrounds.js\`: \`STANDARD\`, \`HINTERGRUENDE\` (tag → imagem), \`VERBLASSEN\` (véu para facilitar a leitura), \`EDITOR_KARTE\` (cartão atrás do texto) e \`UEBERBLENDEN_MS\`. Coloque as suas próprias imagens (SVG, PNG, JPG, WebP) na pasta \`hintergruende/\`.`,
  },
  /* </uebersetzungen> */
};
const sbJe = k => Object.fromEntries(Object.entries(SB_TEXTE).map(([l, v]) => [l, v[k]]));

NoNotesPlugins.register({
  id: 'szenen-hintergruende',
  name: SB_TEXTE.de.name,
  version: '1.2.0',
  api: 1,
  description: SB_TEXTE.de.description,
  names: sbJe('name'),
  descriptions: sbJe('description'),
  help: sbJe('help'),

  activate(ctx) {
    const P = window.NoNotesPlugins;
    const clamp = (v, lo, hi, d) => (Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d);
    const fade = clamp(VERBLASSEN, 0, 0.9, 0.3);
    const card = clamp(EDITOR_KARTE, 0, 1, 0.8);
    const ms = clamp(UEBERBLENDEN_MS, 0, 5000, 500);

    // Bild-Pfad → CSS-Wert url("…"); ungültige Pfade werden abgelehnt
    const base = SZENEN_ORDNER || (P.base && P.base()) || window.location.href;
    function cssUrl(path) {
      if (path == null) return null;
      if (typeof path !== 'string' || !path.trim() || /["\\\n\r<>]/.test(path)) return undefined;
      try { return `url("${new URL(path.trim(), base).href}")`; } catch (e) { return undefined; }
    }

    const standard = cssUrl(STANDARD);
    const rules = [];
    for (const r of HINTERGRUENDE) {
      const tag = String((r && r.tag) || '').replace(/^#/, '').trim().toLowerCase();
      const url = cssUrl(r && r.bild);
      if (!tag || url === undefined) { console.warn('Szenen-Hintergründe: Eintrag übersprungen', r); continue; } // i18n-ignore
      rules.push({ tag, url });
    }

    // Zwei Ebenen hinter dem Inhalt, die beim Wechsel überblendet werden
    const layout = document.querySelector('main.layout');
    if (!layout) { console.warn('Szenen-Hintergründe: Arbeitsbereich nicht gefunden'); return; } // i18n-ignore
    const style = document.createElement('style');
    style.id = 'sceneBgStyle';
    style.textContent = `
      main.layout { position: relative; isolation: isolate; }
      .sb-layer { position: absolute; inset: 0; z-index: -1; pointer-events: none; opacity: 0; background-size: cover; background-position: center; background-repeat: no-repeat; transition: opacity ${ms}ms ease; }
      .sb-layer.sb-on { opacity: 1; }
      /* Der Editor aus der Mindmap liegt als Vollbild-Ebene mit eigenem Hintergrund über dem Arbeitsbereich */
      body.sb-active:not(.view-list).editor-open .editor { background: var(--sb-bg) center / cover no-repeat, var(--bg); }
      body.sb-active #editorPane { background: color-mix(in srgb, var(--bg) ${Math.round(card * 100)}%, transparent); border-radius: var(--radius, 8px); }
      @media (prefers-reduced-motion: reduce) { .sb-layer { transition: none; } }
    `;
    document.head.appendChild(style);
    const layers = [0, 1].map(() => {
      const d = document.createElement('div');
      d.className = 'sb-layer';
      d.setAttribute('aria-hidden', 'true');
      layout.insertBefore(d, layout.firstChild);
      return d;
    });
    let front = 0;          // Ebene, die gerade sichtbar ist
    let shown;              // zuletzt gesetzter CSS-Wert (undefined = noch nichts)

    // Farbe des Designs als Schleier über dem Bild (hält Schrift und Knoten lesbar, hell wie dunkel)
    const veilOf = () => {
      const c = `color-mix(in srgb, var(--bg) ${Math.round(fade * 100)}%, transparent)`;
      return `linear-gradient(${c}, ${c})`;
    };

    function show(url) {
      if (url === shown) return;
      shown = url;
      const next = layers[1 - front], prev = layers[front];
      if (url) {
        next.style.backgroundImage = `${veilOf()}, ${url}`;
        next.classList.add('sb-on');
        prev.classList.remove('sb-on');
        front = 1 - front;
      } else {
        prev.classList.remove('sb-on');
      }
      document.body.classList.toggle('sb-active', !!url);
      if (url) document.documentElement.style.setProperty('--sb-bg', `${veilOf()}, ${url}`);
      else document.documentElement.style.removeProperty('--sb-bg');
    }

    // Bild für eine Notiz: eigene Tags, dann die der Eltern nach oben; sonst STANDARD
    async function sceneFor(id) {
      if (typeof id !== 'number') return standard;
      const chain = [id, ...(await ctx.backend.getPath(id)).map(p => p.id).reverse()];
      for (const nid of chain) {
        const tags = (await ctx.backend.getTags(nid)).map(x => String(x).toLowerCase());
        const rule = rules.find(r => tags.includes(r.tag));
        if (rule) return rule.url;
      }
      return standard;
    }

    let selected = null;   // Auswahl in der Mindmap
    let token = 0;
    async function update() {
      const mine = ++token;
      const open = ctx.editor.noteId();
      const id = open != null ? open : selected;
      let url;
      try { url = await sceneFor(id); } catch (e) { url = standard; }
      if (mine === token) show(url);
    }

    // Ältere NoNotes-Versionen kennen mindmap:select / mindmap:rendered nicht: dann wirkt nur das Öffnen im Editor
    const on = (event, fn) => { if (P.EVENTS.includes(event)) ctx.on(event, fn); };
    on('mindmap:select', ({ id }) => { selected = id; return update(); });
    on('note:open', () => update());
    on('note:close', () => update());
    on('note:saved', () => update());
    on('mindmap:rendered', () => update());
    on('database:replaced', () => { selected = null; return update(); });

    // Tag-Änderungen im Editor (die App meldet sie nicht als Ereignis): Tag-Leiste beobachten
    const chips = document.getElementById('tagChips');
    if (chips) new MutationObserver(() => update()).observe(chips, { childList: true });

    update();
  },
});
