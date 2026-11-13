/**
 * mm_custom_sixten : vue 3D du tapis en cours de personnalisation (Mathieu, 2026-11-12).
 *
 * Module ES chargé au premier clic sur le bouton « 3D » de la barre d'outils (layout.js) : rien n'est téléchargé avant.
 * three.js 0.170 vient de jsDelivr (version figée, modules +esm qui partagent la même instance de three).
 *
 * Reprise de la démo `_assets/3dmat` (rendu validé par Mathieu) :
 *   - texture, comme la démo : photo de feutre (views/img/felt.webp, 2400 px = 200 cm) répétée à l'échelle réelle, puis
 *     l'impression posée en « overlay » à 95 % avec un léger flou d'encre. L'impression est l'image du design sans feutre que
 *     produit le configurateur (MmCustom.export.canvas({ texture: false }) : polices et logos incorporés, bordure), passée par
 *     layout.js. L'assemblage (feutre répété, encre floutée, fusion overlay) est calculé par la carte graphique (shader, rendu
 *     dans une texture) : quelques millisecondes, et le même résultat partout, alors que le filtre « blur » du canvas ne rend
 *     pas pareil selon les navigateurs (absent des anciens Safari) et qu'un flou calculé en JavaScript prend 2 à 4 s ;
 *   - relief du feutre : la même photo de feutre répétée, contraste étiré ;
 *   - géométrie : base caoutchouc de 2 mm à coins arrondis, insert feutre en retrait de 2 cm qui dépasse de 4 mm ;
 *     l'impression couvre tout le tapis, la bordure recouvre ses 2 cm extérieurs ;
 *   - éclairage : environnement « pièce » + lumière principale avec ombre douce au sol.
 *
 * Réalité augmentée (« Voir chez moi », repris de la même démo) : poser le tapis au sol, en taille réelle, avec le téléphone.
 *   - iPhone / iPad : AR Quick Look, sur un fichier USDZ fabriqué dans le navigateur à l'ouverture de la vue 3D ;
 *   - Android (Chrome, ARCore) : WebXR « immersive-ar » avec détection du sol, boutons tourner / déplacer / fermer ;
 *   - ordinateur (pointeur principal qui n'est pas tactile, sans RA) : le bouton ouvre un QR code. options.share() envoie l'image de l'impression au
 *     serveur (controllers/front/ar.php, gardée 48 h) et rend l'adresse d'une page qui ouvre cette vue 3D sur le téléphone ;
 *   - téléphone sans RA : pas de bouton.
 *
 * open({ art, felt, inkBlur, sizeCm, title, subtitle, fileName, t, share }) -> Promise<void>
 *   share : facultatif, () -> Promise<string> (adresse pour le téléphone) ; sans lui, pas de QR code sur ordinateur
 *   art : canvas de l'impression ; felt : URL de la photo de feutre ; inkBlur : rayon du flou en px de art
 */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/+esm'
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/controls/OrbitControls.js/+esm'
import { RoomEnvironment } from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/environments/RoomEnvironment.js/+esm'

const BORDER = 0.02         // bordure caoutchouc : 2 cm sur tous les côtés
const RUBBER_THICK = 0.002  // base caoutchouc : 2 mm
const FELT_TOP = RUBBER_THICK + 0.004
const RADIUS = 0.006
const FELT_RADIUS = 0.002
const FILL = 0.92           // part de la zone disponible occupée par le tapis

// Éclairage mesuré (2026-11-12) : en vue de dessus, un fond orange #FD5100 sort à 1 ou 2 % de l image 2D ; les valeurs de la
// démo (exposition 0.9, lumière 2.2, environnement 1, duvet 0.15) le blanchissaient (écart de 94 sur 255) sur ce fond clair
const LIGHTING = { exposure: 0.76, key: 1.55, hemi: 0.2, env: 0.5, sheen: 0.04 }

const VIEW_DEFAULT = new THREE.Vector3(-0.58, 0.56, 0.60).normalize()
const VIEW_TOP = new THREE.Vector3(0, 1, 0.0001).normalize()

const ICONS = {
    rotate: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v5h-5"/></svg>',
    reset: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h4M17 12h4M12 3v4M12 17v4"/><circle cx="12" cy="12" r="4"/></svg>',
    top: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="7" width="18" height="10"/></svg>',
    shot: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h3l1.5-2h7L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
    ar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/></svg>',
}

// ---- réalité augmentée : outils ----
// Sépare une géométrie par groupe de matériaux (l'exporteur USDZ ne gère pas les tableaux de matériaux)
function splitByGroups(geo) {
    return geo.groups.map((g) => {
        const out = new THREE.BufferGeometry()

        for (const [name, attr] of Object.entries(geo.attributes)) {
            const n = attr.itemSize

            out.setAttribute(name, new THREE.BufferAttribute(attr.array.slice(g.start * n, (g.start + g.count) * n), n))
        }

        return { geo: out, materialIndex: g.materialIndex }
    })
}

// Carte de normales calculée depuis le relief (Quick Look ne gère pas les bump maps)
function bumpToNormalTexture(bumpTex, size = 1024, strength = 2) {
    const src = document.createElement('canvas')

    src.width = src.height = size

    const sctx = src.getContext('2d', { willReadFrequently: true })

    sctx.drawImage(bumpTex.image, 0, 0, size, size)

    const hd = sctx.getImageData(0, 0, size, size).data
    const c = document.createElement('canvas')

    c.width = c.height = size

    const ctx = c.getContext('2d')
    const out = ctx.createImageData(size, size)
    const od = out.data
    const H = (x, y) => hd[(((y + size) % size) * size + ((x + size) % size)) * 4] / 255

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const dx = (H(x + 1, y) - H(x - 1, y)) * strength
            const dy = (H(x, y + 1) - H(x, y - 1)) * strength
            const l = Math.hypot(dx, dy, 1)
            const i = (y * size + x) * 4

            od[i] = (-dx / l * 0.5 + 0.5) * 255
            od[i + 1] = (dy / l * 0.5 + 0.5) * 255
            od[i + 2] = (1 / l * 0.5 + 0.5) * 255
            od[i + 3] = 255
        }
    }
    ctx.putImageData(out, 0, 0)

    const t = new THREE.CanvasTexture(c)

    t.colorSpace = THREE.NoColorSpace
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.copy(bumpTex.repeat)
    t.offset.copy(bumpTex.offset)

    return t
}

async function arMode() {
    const probe = document.createElement('a')

    if (probe.relList && probe.relList.supports && probe.relList.supports('ar')) return 'quicklook'
    // Some browsers never answer this question (no AR runtime): no answer in 3 s means no AR
    const answer = navigator.xr ? navigator.xr.isSessionSupported('immersive-ar').catch(() => false) : Promise.resolve(false)

    if (await Promise.race([answer, new Promise((resolve) => setTimeout(() => resolve(false), 3000))])) return 'webxr'

    return ''
}

function roundedRect(w, h, r) {
    const s = new THREE.Shape()
    const x = -w / 2
    const y = -h / 2

    s.moveTo(x + r, y)
    s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r)
    s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r)
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y)

    return s
}

// Bloc extrudé couché à plat, de y0 à y1 ; uvFull : UV sur tout le tapis (WIDTH × HEIGHT) pour aligner l'impression
function slab(W, H, w, h, r, y0, y1, bevel, uvFull) {
    const geo = new THREE.ExtrudeGeometry(roundedRect(w - bevel * 2, h - bevel * 2, r), {
        depth: (y1 - y0) - bevel * 2, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel,
        bevelSegments: 4, curveSegments: 12,
    })

    if (uvFull) {
        const pos = geo.attributes.position
        const uv = geo.attributes.uv

        for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / W + 0.5, pos.getY(i) / H + 0.5)
        uv.needsUpdate = true
    }

    geo.rotateX(-Math.PI / 2)
    geo.translate(0, y0 + bevel, 0)
    geo.computeVertexNormals()

    return geo
}

const PATTERN_CM = 200     // largeur réelle couverte par la photo de feutre
const INK_OPACITY = 0.95

function loadImage(src) {
    const img = new Image()

    img.decoding = 'async'
    img.src = src

    return img.decode().then(() => img)
}

// Texture couleur, assemblée par la carte graphique dans une texture de rendu (même méthode que la démo 3dmat, faite au
// canvas) : feutre répété à l'échelle réelle ; encre = l'impression floutée (noyau gaussien 5 × 5) ; fusion « overlay » de
// l'encre sur le feutre à 95 % d'opacité, avec les formules du canvas (calcul sur les valeurs sRGB, comme le navigateur).
function printTexture(art, felt, blur, W, H, renderer) {
    const w = Math.min(renderer.capabilities.maxTextureSize, art.width)
    const h = Math.round(w * art.height / art.width)
    const artTex = new THREE.CanvasTexture(art)
    const feltTex = felt ? new THREE.Texture(felt) : null

    artTex.colorSpace = THREE.NoColorSpace
    artTex.generateMipmaps = false
    artTex.minFilter = THREE.LinearFilter
    if (feltTex) {
        feltTex.colorSpace = THREE.NoColorSpace
        feltTex.wrapS = feltTex.wrapT = THREE.RepeatWrapping
        feltTex.needsUpdate = true
    }

    const rx = W * 100 / PATTERN_CM
    const ry = felt ? H * 100 / (PATTERN_CM * felt.naturalHeight / felt.naturalWidth) : 1
    // texture sRGB (stockage sRGB 8 bits, comme une image) : le shader écrit du linéaire, la carte graphique encode et décode
    const target = new THREE.WebGLRenderTarget(w, h, { colorSpace: THREE.SRGBColorSpace, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter })
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
        uniforms: {
            art: { value: artTex }, felt: { value: feltTex }, hasFelt: { value: felt ? 1 : 0 },
            texel: { value: new THREE.Vector2(1 / art.width, 1 / art.height) }, sigma: { value: Math.max(0.0001, blur) },
            repeat: { value: new THREE.Vector2(rx, ry) }, offset: { value: new THREE.Vector2(0, 1 - (ry % 1)) }, opacity: { value: INK_OPACITY },
        },
        vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
        fragmentShader: `
            uniform sampler2D art; uniform sampler2D felt; uniform float hasFelt; uniform vec2 texel; uniform float sigma;
            uniform vec2 repeat; uniform vec2 offset; uniform float opacity; varying vec2 vUv;
            void main() {
                vec4 ink = vec4(0.0); float total = 0.0;
                for (int y = -2; y <= 2; y++) for (int x = -2; x <= 2; x++) {
                    float k = exp(-float(x * x + y * y) / (2.0 * sigma * sigma));
                    ink += texture2D(art, vUv + vec2(float(x), float(y)) * texel) * k; total += k;
                }
                ink /= total;
                vec3 b = hasFelt > 0.5 ? texture2D(felt, vUv * repeat + offset).rgb : vec3(0.5);
                vec3 s = ink.rgb;
                vec3 o = mix(2.0 * b * s, 1.0 - 2.0 * (1.0 - b) * (1.0 - s), step(0.5, b));
                vec3 c = mix(b, o, ink.a * opacity);
                // valeurs sRGB (calcul du navigateur) -> linéaires, pour la texture sRGB
                gl_FragColor = vec4(mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c)), 1.0);
            }`,
    }))
    const scene = new THREE.Scene()
    const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

    scene.add(quad)
    renderer.setRenderTarget(target)
    renderer.render(scene, cam)
    renderer.setRenderTarget(null)
    quad.geometry.dispose()
    quad.material.dispose()
    artTex.dispose()
    if (feltTex) feltTex.dispose()

    const tex = target.texture

    tex.anisotropy = renderer.capabilities.getMaxAnisotropy()
    tex.userData.target = target
    tex.userData.size = [w, h]

    return tex
}

// La texture de rendu en canvas (fichier USDZ de Quick Look : l'exporteur a besoin d'une image)
function textureToCanvas(tex, renderer) {
    const [w, h] = tex.userData.size
    const px = new Uint8Array(w * h * 4)

    renderer.readRenderTargetPixels(tex.userData.target, 0, 0, w, h, px)

    const c = document.createElement('canvas')

    c.width = w
    c.height = h

    const ctx = c.getContext('2d')
    const img = ctx.createImageData(w, h)

    for (let y = 0; y < h; y++) img.data.set(px.subarray((h - 1 - y) * w * 4, (h - y) * w * 4), y * w * 4) // lignes GL de bas en haut
    ctx.putImageData(img, 0, 0)

    const t = new THREE.CanvasTexture(c)

    t.colorSpace = THREE.SRGBColorSpace

    return t
}

// Relief : le feutre en niveaux de gris, contraste étiré (il ne varie que de quelques %), répété à la même échelle
function bumpTexture(felt, W, H, renderer) {
    const c = document.createElement('canvas')

    c.width = felt.naturalWidth
    c.height = felt.naturalHeight

    const ctx = c.getContext('2d', { willReadFrequently: true })

    ctx.drawImage(felt, 0, 0)

    const data = ctx.getImageData(0, 0, c.width, c.height)
    const d = data.data
    const hist = new Uint32Array(256)
    const n = d.length / 4
    let lo = 0
    let hi = 255
    let acc = 0

    for (let i = 0; i < d.length; i += 4) hist[d[i]]++
    for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc >= n * 0.01) { lo = v; break } }
    acc = 0
    for (let v = 255; v >= 0; v--) { acc += hist[v]; if (acc >= n * 0.01) { hi = v; break } }

    const k = 255 / Math.max(1, hi - lo)

    for (let i = 0; i < d.length; i += 4) {
        const g = Math.max(0, Math.min(255, (d[i] - lo) * k))

        d[i] = d[i + 1] = d[i + 2] = g
    }
    ctx.putImageData(data, 0, 0)

    const t = new THREE.CanvasTexture(c)
    const rx = W * 100 / PATTERN_CM
    const ry = H * 100 / (PATTERN_CM * felt.naturalHeight / felt.naturalWidth)

    t.colorSpace = THREE.NoColorSpace
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.anisotropy = renderer.capabilities.getMaxAnisotropy()
    t.repeat.set(rx, ry)
    t.offset.set(0, 1 - (ry % 1)) // même origine (coin haut gauche) que la texture couleur

    return t
}

function el(tag, className, html) {
    const node = document.createElement(tag)

    if (className) node.className = className
    if (html !== undefined) node.innerHTML = html

    return node
}

export function supported() {
    try {
        const c = document.createElement('canvas')

        return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')))
    } catch (e) {
        return false
    }
}

export async function open(options) {
    const t = options.t || function (key, fallback) { return fallback }
    const W = options.sizeCm.length / 100
    const H = options.sizeCm.width / 100
    // Éclairage (réglable par options.lighting pour les essais) : voir LIGHTING
    const L = Object.assign({}, LIGHTING, options.lighting || {})

    // ---- interface ----
    const overlay = el('div', 'sx3d')
    overlay.setAttribute('role', 'dialog')
    overlay.setAttribute('aria-modal', 'true')
    overlay.setAttribute('aria-label', t('view3dTitle', '3D view'))

    const head = el('div', 'sx3d__head')
    const titles = el('div', 'sx3d__titles')
    const eyebrow = el('p', 'sx3d__eyebrow')
    const title = el('p', 'sx3d__title')
    const close = el('button', 'sx3d__close', '&times;')

    eyebrow.textContent = options.subtitle || ''
    title.textContent = options.title || ''
    close.type = 'button'
    close.setAttribute('aria-label', t('close', 'Close'))
    titles.append(eyebrow, title)
    head.append(titles, close)

    const viewer = el('div', 'sx3d__viewer')
    const hint = el('p', 'sx3d__hint')
    hint.textContent = t('view3dHint', 'Drag to turn · Scroll or pinch to zoom')

    const tools = el('div', 'sx3d__tools')
    const button = (icon, label) => {
        const b = el('button', 'sx3d__tool', icon)

        b.type = 'button'
        b.title = label
        b.setAttribute('aria-label', label)
        tools.appendChild(b)

        return b
    }
    const bRotate = button(ICONS.rotate, t('view3dRotate', 'Turn automatically'))
    const bReset = button(ICONS.reset, t('view3dReset', 'Reset the view'))
    const bTop = button(ICONS.top, t('view3dTop', 'Top view'))
    const bShot = button(ICONS.shot, t('view3dShot', 'Download this view'))

    bRotate.setAttribute('aria-pressed', 'false')

    // « Voir chez moi » : affiché seulement si l'appareil sait poser le tapis au sol (voir setupAR)
    const bAR = el('button', 'sx3d__ar', ICONS.ar + '<span></span>')
    const bARLabel = bAR.querySelector('span')

    bAR.type = 'button'
    bAR.hidden = true
    bARLabel.textContent = t('arButton', 'See it at home')
    tools.appendChild(bAR)

    // Ordinateur : QR code vers la même vue 3D sur le téléphone (« Voir chez moi »)
    const qr = el('div', 'sx3d-qr')
    const qrCard = el('div', 'sx3d-qr__card')
    const qrClose = el('button', 'sx3d-qr__close', '&times;')
    const qrTitle = el('p', 'sx3d-qr__title')
    const qrCode = el('div', 'sx3d-qr__code')
    const qrText = el('p', 'sx3d-qr__text')
    const qrLink = el('a', 'sx3d-qr__link')

    qr.hidden = true
    qr.setAttribute('role', 'dialog')
    qr.setAttribute('aria-modal', 'true')
    qrClose.type = 'button'
    qrClose.setAttribute('aria-label', t('close', 'Close'))
    qrTitle.textContent = t('arQrTitle', 'See it at home with your phone')
    qrText.textContent = t('arQrText', 'Scan this code with your phone to place the mat on your floor, in real size. The link works for 48 hours.')
    qrLink.target = '_blank'
    qrLink.rel = 'noopener'
    qrLink.textContent = t('arQrLink', 'Open the link')
    qrCard.append(qrClose, qrTitle, qrCode, qrText, qrLink)
    qr.appendChild(qrCard)

    // Interface pendant la session WebXR (dom-overlay) : message en haut, boutons en bas
    const arOverlay = el('div', 'sx3d-ar')
    const arMsg = el('p', 'sx3d-ar__msg')
    const arCtrls = el('div', 'sx3d-ar__ctrls')
    const arButton = (cls, text, label) => {
        const b = el('button', 'sx3d-ar__btn ' + cls)

        b.type = 'button'
        b.textContent = text
        if (label) { b.title = label; b.setAttribute('aria-label', label) }
        arCtrls.appendChild(b)

        return b
    }
    const arLeft = arButton('sx3d-ar__btn--turn', '⟲', t('arTurnLeft', 'Turn left'))
    const arMove = arButton('', t('arMove', 'Move'))
    const arRight = arButton('sx3d-ar__btn--turn', '⟳', t('arTurnRight', 'Turn right'))
    const arClose = arButton('sx3d-ar__btn--close', t('close', 'Close'))

    arOverlay.append(arMsg, arCtrls)
    overlay.append(viewer, head, hint, tools, qr)
    document.body.appendChild(overlay)
    document.documentElement.classList.add('sx3d-on')

    // ---- scène ----
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.NeutralToneMapping
    renderer.toneMappingExposure = L.exposure
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.xr.enabled = true
    viewer.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const pmrem = new THREE.PMREMGenerator(renderer)
    const envTarget = pmrem.fromScene(new RoomEnvironment(renderer), 0.04)

    scene.environment = envTarget.texture
    scene.environmentIntensity = L.env

    const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 50)
    const controls = new OrbitControls(camera, renderer.domElement)

    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.screenSpacePanning = false // le déplacement (clic droit, deux doigts) reste dans le plan du tapis
    controls.minDistance = 0.3
    controls.maxDistance = 15
    controls.maxPolarAngle = Math.PI * 0.495
    controls.autoRotateSpeed = 0.6

    const reach = Math.max(W, H)
    const key = new THREE.DirectionalLight(0xffffff, L.key)

    key.castShadow = true
    key.shadow.mapSize.set(2048, 2048)
    key.shadow.camera.left = -reach; key.shadow.camera.right = reach
    key.shadow.camera.top = reach; key.shadow.camera.bottom = -reach
    key.shadow.camera.near = 0.1; key.shadow.camera.far = 10
    key.shadow.radius = 6
    key.shadow.bias = -0.0005
    key.position.set(Math.cos(0.61) * 3, 4, Math.sin(0.61) * 3)
    // Tout ce qui appartient au tapis (tapis, ombre au sol, lumière) : en réalité augmentée, c'est ce groupe qu'on pose
    const world = new THREE.Group()

    scene.add(world, new THREE.HemisphereLight(0xffffff, 0x444444, L.hemi))
    world.add(key, key.target)

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.ShadowMaterial({ opacity: 0.22 }))

    ground.rotation.x = -Math.PI / 2
    ground.position.y = -0.0005
    ground.receiveShadow = true
    world.add(ground)

    // ---- tapis ----
    const feltImg = options.felt ? await loadImage(options.felt).catch(() => null) : null
    const map = printTexture(options.art, feltImg, options.inkBlur || 0, W, H, renderer)
    const top = new THREE.MeshPhysicalMaterial({
        map, roughness: 0.95, metalness: 0, sheen: L.sheen, sheenRoughness: 0.6, sheenColor: new THREE.Color(0x3a3a3a),
    })

    if (feltImg) {
        top.bumpMap = bumpTexture(feltImg, W, H, renderer)
        top.bumpScale = 1.5
    }

    const feltSide = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.95, metalness: 0 })
    const rubberMat = new THREE.MeshStandardMaterial({ color: 0x2f2f2f, roughness: 0.62, metalness: 0 })
    const mat = new THREE.Group()
    const rubber = new THREE.Mesh(slab(W, H, W, H, RADIUS, 0, RUBBER_THICK, 0.0007, false), rubberMat)
    const felt = new THREE.Mesh(slab(W, H, W - BORDER * 2, H - BORDER * 2, FELT_RADIUS, RUBBER_THICK - 0.0005, FELT_TOP, 0.0006, true), [top, feltSide])

    for (const m of [rubber, felt]) { m.castShadow = true; m.receiveShadow = true; mat.add(m) }
    world.add(mat)

    // ---- cadrage : tout le tapis dans la zone libre entre l'en-tête et les outils ----
    function size() {
        const r = viewer.getBoundingClientRect()

        return { w: Math.max(1, r.width), h: Math.max(1, r.height) }
    }

    function frameView(dir) {
        const { w, h } = size()
        const headBox = head.getBoundingClientRect()
        const toolsBox = tools.getBoundingClientRect()
        const viewBox = viewer.getBoundingClientRect()
        const mTop = Math.max(0, headBox.bottom - viewBox.top) + 12
        const mBottom = Math.max(0, viewBox.bottom - toolsBox.top) + 12
        const mSide = 16
        const x0 = -1 + 2 * mSide / w
        const x1 = 1 - 2 * mSide / w
        const y0 = -1 + 2 * mBottom / h
        const y1 = 1 - 2 * mTop / h
        const cx = (x0 + x1) / 2
        const cy = (y0 + y1) / 2
        const hx = (x1 - x0) / 2 * FILL
        const hy = (y1 - y0) / 2 * FILL
        const corners = []

        for (const x of [-W / 2, W / 2]) for (const y of [0, FELT_TOP]) for (const z of [-H / 2, H / 2]) corners.push(new THREE.Vector3(x, y, z))

        const cam = camera.clone()
        const target = new THREE.Vector3()
        const right = new THREE.Vector3()
        const up = new THREE.Vector3()
        const p = new THREE.Vector3()
        let dist = 4

        cam.aspect = w / h
        cam.updateProjectionMatrix()

        for (let i = 0; i < 40; i++) {
            cam.position.copy(target).addScaledVector(dir, dist)
            cam.up.set(0, 1, 0)
            cam.lookAt(target)
            cam.updateMatrixWorld()

            let minX = Infinity; let maxX = -Infinity; let minY = Infinity; let maxY = -Infinity

            for (const c of corners) {
                p.copy(c).project(cam)
                minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x)
                minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y)
            }

            dist *= Math.max((maxX - minX) / (2 * hx), (maxY - minY) / (2 * hy))

            const halfH = dist * Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2)
            const halfW = halfH * cam.aspect

            right.setFromMatrixColumn(cam.matrixWorld, 0)
            up.setFromMatrixColumn(cam.matrixWorld, 1)
            target.addScaledVector(right, ((minX + maxX) / 2 - cx) * halfW).addScaledVector(up, ((minY + maxY) / 2 - cy) * halfH)
        }

        // Le point visé est ramené sur le dessus du tapis, le long de l'axe de vue (même cadrage) : le zoom s'approche
        // alors de la surface sans jamais la traverser
        const pos = target.clone().addScaledVector(dir, dist)

        if (dir.y > 0.05) target.copy(pos).addScaledVector(dir, -(pos.y - FELT_TOP) / dir.y)

        return { pos, target }
    }

    let flyTo = null
    const ease = (x) => 1 - Math.pow(1 - x, 3)

    function applyView(dir, animate) {
        const v = frameView(dir)

        if (animate) flyTo = { p0: camera.position.clone(), t0: controls.target.clone(), p1: v.pos, t1: v.target, k: 0 }
        else { camera.position.copy(v.pos); controls.target.copy(v.target); controls.update() }
    }

    let userMoved = false
    let dirty = true

    controls.addEventListener('start', () => { userMoved = true; flyTo = null })

    function resize() {
        const { w, h } = size()

        dirty = true

        renderer.setSize(w, h, false)
        camera.aspect = w / h
        camera.updateProjectionMatrix()
        if (!userMoved) applyView(VIEW_DEFAULT, false)
    }

    const ro = new ResizeObserver(resize)

    ro.observe(viewer)
    resize()
    if (options.view === 'top') applyView(VIEW_TOP, false)

    // Rendu à la demande : la scène n'est redessinée que si la vue change (geste, inertie, animation, rotation
    // automatique, redimensionnement). Immobile, elle ne consomme rien (batterie des téléphones).
    const clock = new THREE.Clock()

    // Garde-fous : la cible reste sur le dessus du tapis, la caméra au-dessus (jamais dans le tapis ni dessous)
    controls.addEventListener('change', () => {
        dirty = true
        controls.target.y = FELT_TOP
        if (camera.position.y < FELT_TOP + 0.04) camera.position.y = FELT_TOP + 0.04
    })

    renderer.setAnimationLoop((time, frame) => {
        const dt = clock.getDelta()

        if (renderer.xr.isPresenting) {
            updateHitTest(frame)
            renderer.render(scene, camera)

            return
        }

        if (flyTo) {
            flyTo.k = Math.min(1, flyTo.k + dt / 1.1)
            const k = ease(flyTo.k)

            camera.position.lerpVectors(flyTo.p0, flyTo.p1, k)
            controls.target.lerpVectors(flyTo.t0, flyTo.t1, k)
            if (flyTo.k >= 1) flyTo = null
            dirty = true
        }
        if (controls.update(dt)) dirty = true
        if (!dirty) return
        dirty = false
        renderer.render(scene, camera)
    })

    requestAnimationFrame(() => overlay.classList.add('is-open'))

    // ---- outils ----
    bRotate.addEventListener('click', () => {
        controls.autoRotate = !controls.autoRotate
        bRotate.setAttribute('aria-pressed', String(controls.autoRotate))
    })
    bReset.addEventListener('click', () => { userMoved = false; applyView(VIEW_DEFAULT, true) })
    bTop.addEventListener('click', () => applyView(VIEW_TOP, true))
    bShot.addEventListener('click', () => {
        const a = document.createElement('a')

        a.download = (options.fileName || 'tapis') + '-3d.png'
        renderer.render(scene, camera)
        a.href = renderer.domElement.toDataURL('image/png')
        document.body.appendChild(a)
        a.click()
        a.remove()
    })

    // ---- réalité augmentée ----
    let mode = ''
    let usdzUrl = null
    let xrSession = null
    let hitSource = null
    let placed = false
    let yawOffset = 0
    const reticle = new THREE.Group()

    {
        // aperçu avant la pose : le contour du tapis et un repère central
        const outline = new THREE.LineLoop(
            new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(-W / 2, 0, -H / 2), new THREE.Vector3(W / 2, 0, -H / 2),
                new THREE.Vector3(W / 2, 0, H / 2), new THREE.Vector3(-W / 2, 0, H / 2)]),
            new THREE.LineBasicMaterial({ color: 0xffffff }))
        const dot = new THREE.Mesh(new THREE.RingGeometry(0.05, 0.065, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffffff }))

        reticle.add(outline, dot)
        reticle.visible = false
        scene.add(reticle)
    }

    const _m = new THREE.Matrix4()
    const _p = new THREE.Vector3()
    const _q = new THREE.Quaternion()
    const _s = new THREE.Vector3()
    const _cam = new THREE.Vector3()

    function updateHitTest(frame) {
        if (!frame || !hitSource || placed) return

        const hits = frame.getHitTestResults(hitSource)

        if (!hits.length) { reticle.visible = false; return }

        const pose = hits[0].getPose(renderer.xr.getReferenceSpace())

        _m.fromArray(pose.transform.matrix).decompose(_p, _q, _s)
        reticle.position.copy(_p)
        // le tapis se présente de face, dans le sens de la longueur
        renderer.xr.getCamera().getWorldPosition(_cam)
        reticle.rotation.set(0, Math.atan2(_cam.x - _p.x, _cam.z - _p.z) + yawOffset, 0)
        if (!reticle.visible) arMsg.textContent = t('arTap', 'Tap the screen to place the mat')
        reticle.visible = true
    }

    async function buildUSDZ() {
        const { USDZExporter } = await import('https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/exporters/USDZExporter.js/+esm')
        const arScene = new THREE.Scene()

        arScene.add(new THREE.Mesh(rubber.geometry, new THREE.MeshStandardMaterial({ color: rubberMat.color, roughness: rubberMat.roughness })))

        const feltMats = [
            new THREE.MeshStandardMaterial({ map: textureToCanvas(map, renderer), normalMap: top.bumpMap ? bumpToNormalTexture(top.bumpMap) : null, roughness: 0.95 }),
            new THREE.MeshStandardMaterial({ color: feltSide.color, roughness: 0.95 }),
        ]

        for (const part of splitByGroups(felt.geometry)) arScene.add(new THREE.Mesh(part.geo, feltMats[part.materialIndex]))

        const data = await new USDZExporter().parseAsync(arScene, { maxTextureSize: 4096, quickLookCompatible: true })

        return URL.createObjectURL(new Blob([data], { type: 'model/vnd.usdz+zip' }))
    }

    async function startWebXR() {
        try {
            xrSession = await navigator.xr.requestSession('immersive-ar', {
                requiredFeatures: ['hit-test'], optionalFeatures: ['dom-overlay'], domOverlay: { root: arOverlay },
            })
        } catch (e) {
            console.error('mm_custom_sixten: AR', e)
            window.alert(t('arFailed', 'Could not start the AR camera on this device.'))

            return
        }

        renderer.xr.setReferenceSpaceType('local')
        await renderer.xr.setSession(xrSession)

        const viewerSpace = await xrSession.requestReferenceSpace('viewer')

        hitSource = await xrSession.requestHitTestSource({ space: viewerSpace })
        placed = false
        yawOffset = 0
        world.visible = false
        arOverlay.classList.add('is-on')
        arMsg.textContent = t('arAim', 'Aim at the floor and move the phone slowly…')

        xrSession.addEventListener('select', () => {
            if (!reticle.visible) return
            world.position.copy(reticle.position)
            world.rotation.y = reticle.rotation.y
            world.visible = true
            reticle.visible = false
            placed = true
            arMsg.textContent = t('arPlaced', 'Mat placed · ⟲ ⟳ to turn it, « Move » to place it again')
        })
        xrSession.addEventListener('end', () => {
            if (hitSource && hitSource.cancel) hitSource.cancel()
            hitSource = null
            xrSession = null
            arOverlay.classList.remove('is-on')
            reticle.visible = false
            world.position.set(0, 0, 0)
            world.rotation.set(0, 0, 0)
            world.visible = true
            dirty = true
        })
    }

    // les boutons de l'overlay ne doivent pas déclencher un « select » (pose du tapis)
    arCtrls.addEventListener('beforexrselect', (e) => e.preventDefault())

    const turn = (deg) => {
        const r = THREE.MathUtils.degToRad(deg)

        if (placed) world.rotation.y += r
        else yawOffset += r
    }

    arLeft.addEventListener('click', () => turn(15))
    arRight.addEventListener('click', () => turn(-15))
    arMove.addEventListener('click', () => {
        placed = false
        world.visible = false
        arMsg.textContent = t('arAgain', 'Aim at the floor then tap the screen to place the mat again')
    })
    arClose.addEventListener('click', () => { if (xrSession) xrSession.end() })

    // QR code : l'image est envoyée une fois par ouverture de la vue 3D, au premier clic
    let shareUrl = null

    async function showQR() {
        qr.hidden = false
        qrClose.focus({ preventScroll: true })

        if (shareUrl) return

        qrCode.replaceChildren()
        qrCode.classList.add('is-busy')
        qrCode.textContent = t('arPreparing', 'Preparing…')
        qrLink.hidden = true

        try {
            const [url, lib] = await Promise.all([options.share(), import('https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/+esm')])
            const make = lib.default || lib
            const code = make(0, 'M')

            code.addData(url)
            code.make()
            shareUrl = url
            qrCode.innerHTML = code.createSvgTag({ cellSize: 6, margin: 2, scalable: true })
            qrLink.href = url
            qrLink.hidden = false
        } catch (e) {
            console.error('mm_custom_sixten: QR', e)
            qrCode.textContent = t('arQrFailed', 'The code could not be created. Try again in a moment.')
        }

        qrCode.classList.remove('is-busy')
    }

    function hideQR() {
        qr.hidden = true
        bAR.focus({ preventScroll: true })
    }

    qrClose.addEventListener('click', hideQR)
    qr.addEventListener('click', (e) => { if (e.target === qr) hideQR() })

    bAR.addEventListener('click', () => {
        if (mode === 'qr') {
            showQR()
        } else if (mode === 'quicklook' && usdzUrl) {
            const a = document.createElement('a')

            a.rel = 'ar'
            a.href = usdzUrl + '#allowsContentScaling=0' // taille réelle bloquée
            a.appendChild(document.createElement('img')) // Quick Look exige une image enfant
            a.click()
        } else if (mode === 'webxr') {
            startWebXR()
        }
    })

    arMode().then(async (m) => {
        // Computer (main pointer not a finger, no AR): the button shows a QR code towards the same 3D view on the phone
        mode = m || (typeof options.share === 'function' && !window.matchMedia('(pointer: coarse)').matches ? 'qr' : '')
        if (!mode) return
        if (mode === 'qr') {
            bAR.hidden = false
            bAR.setAttribute('aria-haspopup', 'dialog')
            return
        }
        document.body.appendChild(arOverlay)
        bAR.hidden = false
        if (mode !== 'quicklook') return

        // iPhone : le fichier USDZ est préparé tout de suite, Quick Look exige un clic qui ouvre directement le fichier
        bAR.disabled = true
        bARLabel.textContent = t('arPreparing', 'Preparing…')
        try {
            usdzUrl = await buildUSDZ()
            bARLabel.textContent = t('arButton', 'See it at home')
            bAR.disabled = false
        } catch (e) {
            console.error('mm_custom_sixten: USDZ', e)
            bAR.hidden = true
        }
    })

    // ---- fermeture : tout est libéré (contexte WebGL, textures, géométries) ----
    return new Promise((resolve) => {
        function onKey(e) {
            if (e.key !== 'Escape') return
            if (!qr.hidden) hideQR()
            else shut()
        }

        function shut() {
            if (xrSession) xrSession.end().catch(() => {})
            if (usdzUrl) URL.revokeObjectURL(usdzUrl)
            arOverlay.remove()
            document.removeEventListener('keydown', onKey)
            ro.disconnect()
            renderer.setAnimationLoop(null)
            controls.dispose()
            scene.traverse((o) => {
                if (o.geometry) o.geometry.dispose()
                const ms = o.material ? [].concat(o.material) : []
                ms.forEach((m) => { for (const k of ['map', 'bumpMap']) if (m[k]) m[k].dispose(); m.dispose() })
            })
            if (map.userData.target) map.userData.target.dispose()
            envTarget.dispose()
            pmrem.dispose()
            renderer.dispose()
            renderer.forceContextLoss()
            overlay.remove()
            document.documentElement.classList.remove('sx3d-on')
            resolve()
        }

        close.addEventListener('click', shut)
        document.addEventListener('keydown', onKey)
        close.focus({ preventScroll: true })
    })
}
