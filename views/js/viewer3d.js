/**
 * mm_custom_sixten : vue 3D du tapis en cours de personnalisation (Mathieu, 2026-11-12).
 *
 * Module ES chargé au premier clic sur le bouton « 3D » de la barre d'outils (layout.js) : rien n'est téléchargé avant.
 * three.js 0.170 vient de jsDelivr (version figée, modules +esm qui partagent la même instance de three).
 *
 * Reprise de la démo `_assets/3dmat` (rendu validé par Mathieu) :
 *   - texture : l'image que produit déjà le configurateur (MmCustom.export.canvas : feutre de la taille, impression en
 *     « overlay » à 95 %, polices et logos incorporés, bordure à plat), passée par layout.js ;
 *   - relief du feutre : la même photo de feutre (img.mat-pattern de la scène), contraste étiré ;
 *   - géométrie : base caoutchouc de 2 mm à coins arrondis, insert feutre en retrait de 2 cm qui dépasse de 4 mm ;
 *     l'impression couvre tout le tapis, la bordure recouvre ses 2 cm extérieurs ;
 *   - éclairage : environnement « pièce » + lumière principale avec ombre douce au sol.
 *
 * open({ canvas, pattern, sizeCm, title, subtitle, t }) -> Promise<void>
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

const VIEW_DEFAULT = new THREE.Vector3(-0.58, 0.56, 0.60).normalize()
const VIEW_TOP = new THREE.Vector3(0, 1, 0.0001).normalize()

const ICONS = {
    rotate: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v5h-5"/></svg>',
    reset: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h4M17 12h4M12 3v4M12 17v4"/><circle cx="12" cy="12" r="4"/></svg>',
    top: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="7" width="18" height="10"/></svg>',
    shot: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h3l1.5-2h7L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
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

// Relief : la photo du feutre en niveaux de gris, contraste étiré (elle ne varie que de quelques %)
function bumpTexture(image, renderer) {
    const c = document.createElement('canvas')
    const size = Math.min(1024, image.naturalWidth || 1024)

    c.width = size
    c.height = Math.round(size * (image.naturalHeight || 1) / (image.naturalWidth || 1))

    const ctx = c.getContext('2d', { willReadFrequently: true })

    ctx.drawImage(image, 0, 0, c.width, c.height)

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

    t.colorSpace = THREE.NoColorSpace
    t.anisotropy = renderer.capabilities.getMaxAnisotropy()

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
    overlay.append(viewer, head, hint, tools)
    document.body.appendChild(overlay)
    document.documentElement.classList.add('sx3d-on')

    // ---- scène ----
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.NeutralToneMapping
    renderer.toneMappingExposure = 0.9
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    viewer.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const pmrem = new THREE.PMREMGenerator(renderer)
    const envTarget = pmrem.fromScene(new RoomEnvironment(renderer), 0.04)

    scene.environment = envTarget.texture

    const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 50)
    const controls = new OrbitControls(camera, renderer.domElement)

    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.minDistance = 0.25
    controls.maxDistance = 15
    controls.maxPolarAngle = Math.PI * 0.495
    controls.autoRotateSpeed = 0.6

    const reach = Math.max(W, H)
    const key = new THREE.DirectionalLight(0xffffff, 2.2)

    key.castShadow = true
    key.shadow.mapSize.set(2048, 2048)
    key.shadow.camera.left = -reach; key.shadow.camera.right = reach
    key.shadow.camera.top = reach; key.shadow.camera.bottom = -reach
    key.shadow.camera.near = 0.1; key.shadow.camera.far = 10
    key.shadow.radius = 6
    key.shadow.bias = -0.0005
    key.position.set(Math.cos(0.61) * 3, 4, Math.sin(0.61) * 3)
    scene.add(key, key.target, new THREE.HemisphereLight(0xffffff, 0x444444, 0.35))

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.ShadowMaterial({ opacity: 0.22 }))

    ground.rotation.x = -Math.PI / 2
    ground.position.y = -0.0005
    ground.receiveShadow = true
    scene.add(ground)

    // ---- tapis ----
    const map = new THREE.CanvasTexture(options.canvas)

    map.colorSpace = THREE.SRGBColorSpace
    map.anisotropy = renderer.capabilities.getMaxAnisotropy()

    const top = new THREE.MeshPhysicalMaterial({
        map, roughness: 0.95, metalness: 0, sheen: 0.15, sheenRoughness: 0.6, sheenColor: new THREE.Color(0x3a3a3a),
    })

    if (options.pattern && options.pattern.naturalWidth) {
        top.bumpMap = bumpTexture(options.pattern, renderer)
        top.bumpScale = 1.5
    }

    const feltSide = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.95, metalness: 0 })
    const rubberMat = new THREE.MeshStandardMaterial({ color: 0x2f2f2f, roughness: 0.62, metalness: 0 })
    const mat = new THREE.Group()
    const rubber = new THREE.Mesh(slab(W, H, W, H, RADIUS, 0, RUBBER_THICK, 0.0007, false), rubberMat)
    const felt = new THREE.Mesh(slab(W, H, W - BORDER * 2, H - BORDER * 2, FELT_RADIUS, RUBBER_THICK - 0.0005, FELT_TOP, 0.0006, true), [top, feltSide])

    for (const m of [rubber, felt]) { m.castShadow = true; m.receiveShadow = true; mat.add(m) }
    scene.add(mat)

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

        return { pos: target.clone().addScaledVector(dir, dist), target }
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

    // Rendu à la demande : la scène n'est redessinée que si la vue change (geste, inertie, animation, rotation
    // automatique, redimensionnement). Immobile, elle ne consomme rien (batterie des téléphones).
    const clock = new THREE.Clock()

    controls.addEventListener('change', () => { dirty = true })

    renderer.setAnimationLoop(() => {
        const dt = clock.getDelta()

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

    // ---- fermeture : tout est libéré (contexte WebGL, textures, géométries) ----
    return new Promise((resolve) => {
        function onKey(e) { if (e.key === 'Escape') shut() }

        function shut() {
            document.removeEventListener('keydown', onKey)
            ro.disconnect()
            renderer.setAnimationLoop(null)
            controls.dispose()
            scene.traverse((o) => {
                if (o.geometry) o.geometry.dispose()
                const ms = o.material ? [].concat(o.material) : []
                ms.forEach((m) => { for (const k of ['map', 'bumpMap']) if (m[k]) m[k].dispose(); m.dispose() })
            })
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
