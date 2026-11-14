/**
 * mm_custom_sixten : interface du configurateur Sixten, sur le moteur window.MmCustom de mm_custom 3.0.
 *
 * Reprise de l'interface de new.sixten (thème sixten v0.18.72, bloc « mm_custom » de assets/js/custom.js), sans ses clics
 * simulés : tout passe par l'API du moteur et par ses composants (views/js/configurator/ui de mm_custom).
 *
 * - en-tête : menus Taille / Design (le design en aperçus), prix et délai, panier, sauvegarde, × avec confirmation ;
 * - rail Couleurs / Textes / Logos : ouvre le panneau d'outils (« Suivant », ×), une ligne par zone, l'éditeur de la zone
 *   choisie sous sa ligne ; un clic sur le tapis ou sur un repère ouvre aussi le panneau ;
 * - éditeurs : texte (champ, alignement, police avec aperçu, taille, masquer, couleurs), couleurs (marques, tendances,
 *   couleurs du gabarit, roue iro.js avec code hexadécimal), logo (vignette, retirer, taille, décalage gauche / droite,
 *   masquer, alerte de dépassement, bibliothèque, dépôt d'un fichier) ;
 * - scène : zoom, quart de tour, repères, image PNG du design, story Instagram 1080 × 1920 (propre à Sixten) ;
 * - réglages du moteur propres à Sixten : glisser sur tout le tapis, poignées et rotation, encre, semelle de 2 cm.
 *
 * Fichier chargé seulement quand ce compagnon est actif (hook actionMmCustomAssets) ; l'interface neutre de mm_custom
 * (customModule.js) ne l'est pas (fiche neutral_ui = false).
 */
;(function (window, document) {
    'use strict'

    const MmCustom = window.MmCustom

    if (!MmCustom || !MmCustom.ready) {
        return
    }

    MmCustom.ready(init)

    function init() {
        const page = document.querySelector('.mmc-configurator.mmc-site-sixten')

        if (!page || !MmCustom.svg.root()) {
            return
        }

        const ui = MmCustom.ui || {}
        const SX = window.mm_custom_sixten || {}
        const TR = SX.translations || {}
        const t = function (key, fallback) { return Object.prototype.hasOwnProperty.call(TR, key) ? TR[key] : fallback }
        const body = document.body
        const $ = function (selector, scope) { return (scope || page).querySelector(selector) }
        const $$ = function (selector, scope) { return Array.from((scope || page).querySelectorAll(selector)) }
        const esc = function (value) { return String(value).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] }) }

        const ICONS = {
            eye: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>',
            eyeOff: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M10.6 10.6A3 3 0 0013.4 13.4M9.9 5.2A10 10 0 0112 5c6 0 10 7 10 7a17 17 0 01-3.2 3.9M6.6 6.6C4 8.4 2 12 2 12s4 7 10 7a10 10 0 004.3-.9"/></svg>',
            chevron: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
            start: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h10M4 18h13"/></svg>',
            middle: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M7 12h10M5.5 18h13"/></svg>',
            end: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M10 12h10M7 18h13"/></svg>',
            rotate: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 11-2.6-5.9"/><path d="M20 4v4.5h-4.5"/></svg>',
            undo: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 010 11H11"/></svg>',
            grid: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="7" height="7"/><rect x="13.5" y="3.5" width="7" height="7"/><rect x="3.5" y="13.5" width="7" height="7"/><rect x="13.5" y="13.5" width="7" height="7"/></svg>',
        }

        /* ------------------------------------------------------------- réglages du moteur (propres à Sixten) */

        // Scale of the mats: their templates are the proofs sent to print, drawn in points at the size they are printed,
        // which is the size sold less 3 cm each way (a 95x200 is a drawing of 92 x 197 cm). The mat measured here is that
        // drawing (decision of Mathieu, 14/11/2026): sizes and distances to the edge are those of the SVG, and the two
        // distances of an element plus its own size make the 92 or the 197 cm. Checked on the short side of the template:
        // another kind of template (the barnums) keeps the scale the engine works out from the size sold.
        ;(function matScale() {
            const POINT_CM = 2.54 / 72
            const product = MmCustom.product
            const size = product && product.configure ? product.sizeCm() : null
            const view = MmCustom.svg.viewBox()

            if (!size || !view || product.isBarnum) return

            if (Math.abs(Math.min(view.width, view.height) * POINT_CM - (size.width - 3)) < 1) {
                product.configure({ cmPerUnit: POINT_CM, borderCm: 0 })
            }
        })()

        // Logos: dragged anywhere on the mat (as on new.sixten), size handles and free rotation
        // (at the finger: the frame alone, the handles would hide the design on a phone)
        if (MmCustom.drag) MmCustom.drag.configure({ logoZone: 'template', handles: true, rotation: true, touchHandles: false })
        // Ink of the print on the felt; border of the mat (Mercury, 2.5 cm): all of it beyond the drawing, on every side
        // (decision of Mathieu, 14/11/2026): the mat is the drawing (92 x 197 for a 95x200), printed whole, and the border
        // is drawn around it on the screen only, nothing laid over the drawing (a sole of an older creation is taken away).
        // The figures are measured from the edge of the drawing. Barnums have no sole
        if (MmCustom.effects) {
            MmCustom.effects.configure({
                ink: true,
                sole: MmCustom.product.isBarnum ? null : { cm: 0, outsideCm: 2.5, fill: '#333333' },
            })
        }

        MmCustom.stats.watchFirstInteraction()

        // Proportions of this mat: the stage sizes it from them (--sx-ratio, site.css)
        const viewBox = MmCustom.svg.viewBox()

        if (viewBox && viewBox.height) body.style.setProperty('--sx-ratio', (viewBox.width / viewBox.height).toFixed(4))

        /* ------------------------------------------------------------- chargement */

        let loaded = false
        const loading = document.getElementById('loading-page')
        const hideLoading = function () {
            if (loading) loading.style.display = 'none'
            window.setTimeout(function () { loaded = true }, 300) // the selections made while the page opens do not open the tools
        }
        const whenLoaded = function () { MmCustom.linked.apply().then(hideLoading, hideLoading) }

        if (document.readyState === 'complete') whenLoaded()
        else window.addEventListener('load', whenLoaded)

        /* ------------------------------------------------------------- fenêtres */

        function openModal(modal) { if (ui.modal) ui.modal.open(modal); else if (modal) modal.classList.add('is-open') }
        function closeModal(modal) { if (ui.modal) ui.modal.close(modal); else if (modal) modal.classList.remove('is-open') }

        function closableModal(modal) {
            if (!modal) return

            modal.addEventListener('click', function (event) { if (event.target === modal) closeModal(modal) })
            document.addEventListener('keydown', function (event) { if (event.key === 'Escape') closeModal(modal) })
            modal.querySelectorAll('.save-auth-close').forEach(function (button) {
                button.addEventListener('click', function (event) { event.preventDefault(); closeModal(modal) })
            })
        }

        /* ------------------------------------------------------------- noms affichés */

        const hexOf = function (color) { return MmCustom.colors.toHex(color) }
        const colorName = function (hex) {
            return hex === '#ffffff' ? t('white', 'White') : hex === '#000000' ? t('black', 'Black') : (hex || '').toUpperCase()
        }
        const familyOf = function (value) { return (value || '').split(',')[0].replace(/['"]/g, '').trim() }
        const prettyFamily = function (family) {
            return familyOf(family).replace(/[-_]+/g, ' ').replace(/([a-z\d])([A-Z])/g, '$1 $2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
                .replace(/(\s+(Regular|Semi ?Bold|Bold|Medium|Light|Black|Italic))+$/i, '').trim()
        }
        const textOf = function (el) {
            if (!el) return ''

            const lines = Array.from(el.querySelectorAll('tspan')).map(function (s) { return s.textContent.trim() }).filter(Boolean)

            return (lines.length ? lines.join(' ') : el.textContent).replace(/\s+/g, ' ').trim()
        }
        // Library logos are named <brand>-bk.svg (black) / <brand>-wh.svg (white)
        const logoLabel = function (file) {
            const base = String(file || '').split('/').pop().replace(/\.[a-z0-9]+$/i, '')
            const m = base.match(/^(.*?)-(bk|wh)$/i)
            const nice = function (v) { return v.replace(/[-_]+/g, ' ').replace(/\b([a-z])/g, function (c) { return c.toUpperCase() }) }

            return m ? nice(m[1]) + ' (' + (m[2].toLowerCase() === 'bk' ? t('black', 'Black') : t('white', 'White')).toLowerCase() + ')' : nice(base)
        }
        const prettyFile = function (name) { return String(name || '').replace(/\.[a-z0-9]+$/i, '').replace(/[-_]+/g, ' ') }

        /* ------------------------------------------------------------- sortes de zones, rail, panneau */

        const KINDS = [
            { key: 'colors', type: 'color', label: t('colors', 'Colors') },
            { key: 'text', type: 'text', label: t('texts', 'Texts') },
            { key: 'logo', type: 'logo', label: t('logos', 'Logos') },
        ].filter(function (kind) { return MmCustom.zones.all(kind.type).length > 0 })

        const kindOfType = function (type) { return KINDS.find(function (k) { return k.type === type }) || null }
        const current = { color: null, text: null, logo: null } // element of the zone chosen in each kind
        let active = null // kind shown in the panel
        const rail = $('.sx-steps')
        const dock = $('#sx-dock')
        const eye = $('.sx-dock__eye', dock)

        KINDS.forEach(function (kind) {
            const button = document.createElement('button')

            button.type = 'button'
            button.dataset.tool = kind.key
            button.title = kind.label
            button.setAttribute('aria-controls', 'sx-dock')
            button.setAttribute('aria-expanded', 'false')
            button.innerHTML = '<span class="sx-steps__label">' + esc(kind.label) + '</span>'
            button.addEventListener('click', function (event) {
                // The open tab closes the panel; another one opens it on its current (or first) zone
                if (active === kind && body.classList.contains('sx-dock-open')) {
                    closeDock()

                    return
                }

                openKind(kind)

                // Keyboard: the focus follows into the panel, on the chosen row
                window.requestAnimationFrame(function () {
                    const row = $('[data-sx-kind="' + kind.key + '"] .sx-row.on')

                    if (row && event.detail === 0) row.focus()
                })
            })
            rail.appendChild(button)
        })

        if (KINDS.length < 2) $('.sx-dock__next', dock).hidden = true

        function paintRail() {
            const open = body.classList.contains('sx-dock-open')

            $$('button', rail).forEach(function (b) {
                const on = !!active && b.dataset.tool === active.key

                b.classList.toggle('on', on)
                b.setAttribute('aria-expanded', String(on && open))
            })
        }

        function setActive(kind) {
            active = kind
            body.dataset.sxKind = kind ? kind.key : '' // the style sheet lays the panel out by kind (phone: texts)
            paintRail()
            $$('[data-sx-kind]').forEach(function (block) { block.hidden = !kind || block.dataset.sxKind !== kind.key })
            eye.textContent = kind ? kind.label : ''
            showMarkers()
            refreshRows()
        }

        function openDock() {
            if (!body.classList.contains('sx-dock-open')) {
                body.classList.add('sx-dock-open')
                paintRail()
                window.dispatchEvent(new Event('resize')) // the stage is narrower: markers and zoom measure again
            }
        }

        function closeDock() {
            if (ui.colorPicker) ui.colorPicker.close()
            body.classList.remove('sx-dock-open')
            paintRail()
            window.dispatchEvent(new Event('resize'))
        }

        function openKind(kind) {
            openDock()

            const zones = MmCustom.zones.all(kind.type)
            const zone = zones.find(function (z) { return z.element === current[kind.type] && z.element.isConnected }) || zones[0]

            if (zone) selectZone(zone)
            else setActive(kind)
        }

        $('.sx-dock__close', dock).addEventListener('click', closeDock)
        $('.sx-dock__next', dock).addEventListener('click', function () {
            const at = KINDS.indexOf(active)

            openKind(KINDS[(at + 1) % KINDS.length])
        })

        /* ------------------------------------------------------------- sélection d'une zone */

        // Text of a logo slot (twin): shown in place of the logo when it is chosen, and the other way round
        function selectZone(zone) {
            if (zone.kind === 'text') {
                const slot = MmCustom.texts.slotOf(zone.element)

                if (slot && !MmCustom.logos.isTextMode(slot)) MmCustom.logos.setTextMode(slot, true)
            } else if (zone.kind === 'logo' && MmCustom.logos.textTwin(zone.element) && MmCustom.logos.isTextMode(zone.element)) {
                MmCustom.logos.setTextMode(zone.element, false)
            }

            MmCustom.zones.select(zone)
        }

        // A click on the mat selects the zone under the pointer (the click that ends a drag is swallowed by drag.js)
        MmCustom.svg.root().addEventListener('click', function (event) {
            const zone = MmCustom.zones.of(event.target)

            if (zone) MmCustom.zones.select(zone)
        })

        MmCustom.on('drag:end', function (event) {
            if (!event.detail.moved) return

            const zone = MmCustom.zones.of(event.detail.element)

            if (zone) MmCustom.zones.select(zone)
        })

        // Every selection (mat, rows, markers) opens the panel on its kind and its editor under its row
        MmCustom.on('select', function (event) {
            const detail = event.detail || {}
            const kind = kindOfType(detail.type)

            if (!detail.element || !kind) return

            current[detail.type] = detail.element
            collapsed[kind.key] = false

            if (ui.colorPicker) ui.colorPicker.close() // the picker belongs to the previous zone
            if (loaded) openDock()

            setActive(kind)

            // Phone: the panel is short, the chosen row comes to its top once the rows are drawn (refreshRows)
            if (loaded) rowToShow = kind.key

            if (detail.type === 'color') syncColor()
            if (detail.type === 'text') syncText()
            if (detail.type === 'logo') syncLogo()
        })

        /* ------------------------------------------------------------- lignes */

        const rows = {}
        const editors = {}
        const collapsed = {} // kind key -> the editor of the chosen row is folded (arrow of the row)
        let rowToShow = null // kind key whose chosen row is to be scrolled to (phone, after a selection)
        let phonePanel = null // phone panels in chips (mountPhonePanels): { chips(kind, zones), follow(element) }
        const logoMeta = {} // name and origin of the logo placed in each slot (slot id)

        KINDS.forEach(function (kind) {
            const block = $('[data-sx-kind="' + kind.key + '"]')

            rows[kind.key] = $('.sx-rows', block)
            editors[kind.key] = $('.sx-editor', block)
            editors[kind.key].hidden = true
        })

        // Thumbnails: the source of an <img>, and a short key to know when it changes (an imported logo is a data URL of
        // up to tens of MB: it is not rebuilt nor compared on every refresh)
        const thumbs = new WeakMap()

        function thumbKey(zone) {
            const el = zone.element
            const href = el.getAttribute('href') || el.getAttributeNS('http://www.w3.org/1999/xlink', 'href') || ''

            return [el.id, zone.source, zone.file || '', href.length, href.slice(-32)].join('|')
        }

        // Template logo: a standalone SVG (its content, framed by its box, with its gradients, clip paths and the template's
        // styles copied in), shown as an <img> so that its ids and url(#…) never enter the page (they would shadow those of
        // the mat). The group's own transform is left out: getBBox measures without it
        function templateThumb(el) {
            const box = el.getBBox()

            if (!box.width || !box.height) return ''

            const root = MmCustom.svg.root()
            const copy = el.cloneNode(true)
            const defs = []
            const seen = {}
            const collect = function (node) {
                const text = Array.from(node.attributes || []).map(function (a) { return a.value }).join(' ')

                ;(text.match(/url\(\s*['"]?#([^'")\s]+)/g) || []).forEach(function (ref) {
                    const id = ref.replace(/^url\(\s*['"]?#/, '')
                    const target = !seen[id] && root.querySelector('[id="' + CSS.escape(id) + '"]')

                    if (!target || el.contains(target)) return

                    seen[id] = true
                    defs.push(target.cloneNode(true))
                    collect(target)
                    target.querySelectorAll('*').forEach(collect)
                })

                const link = node.getAttribute && (node.getAttribute('href') || node.getAttribute('xlink:href'))

                if (link && link.charAt(0) === '#' && !seen[link.slice(1)]) {
                    const target = root.querySelector('[id="' + CSS.escape(link.slice(1)) + '"]')

                    if (target && !el.contains(target)) { seen[link.slice(1)] = true; defs.push(target.cloneNode(true)); collect(target) }
                }
            }

            collect(copy)
            copy.querySelectorAll('*').forEach(collect)

            const styles = Array.from(root.querySelectorAll('style')).map(function (st) { return st.textContent }).join('\n')
            const svg = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="'
                + Math.round(box.width) + '" height="' + Math.round(box.height) + '" viewBox="' + [box.x, box.y, box.width, box.height].join(' ') + '">'
                + (styles ? '<style>' + styles.replace(/</g, '\\3C ') + '</style>' : '')
                + '<defs>' + defs.map(function (d) { return new XMLSerializer().serializeToString(d) }).join('') + '</defs>'
                + Array.from(copy.childNodes).map(function (n) { return new XMLSerializer().serializeToString(n) }).join('') + '</svg>'

            return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
        }

        function logoThumbSrc(zone) {
            const el = zone.element

            if (zone.source === 'library' && zone.file) return MmCustom.config.logosUrl + zone.file
            if (zone.source === 'upload') return el.getAttribute('href') || el.getAttributeNS('http://www.w3.org/1999/xlink', 'href') || ''

            if (zone.source === 'template') {
                try { return templateThumb(el) } catch (e) { return '' } // not rendered
            }

            return ''
        }

        // Puts the thumbnail of a zone in a box, only when it changed
        function paintThumb(box, zone) {
            const key = zone ? thumbKey(zone) : ''

            if (box.dataset.thumb === key) return !!box.firstElementChild

            box.dataset.thumb = key

            const src = zone ? logoThumbSrc(zone) : ''

            if (!src) {
                box.replaceChildren()

                return false
            }

            const img = document.createElement('img')

            img.alt = ''
            img.src = src
            box.replaceChildren(img)

            return true
        }

        function logoInfo(zone) {
            const meta = logoMeta[zone.element.id]
            const hidden = zone.hidden ? ' · ' + t('hidden', 'hidden') : ''

            if (zone.placed) {
                const name = meta ? meta.name : zone.file ? logoLabel(zone.file) : t('placed', 'Logo in place')
                const from = meta ? meta.from : zone.file ? t('fromLibrary', 'From the library') : ''

                return { title: name, meta: from + hidden }
            }

            if (zone.source === 'template') return { title: t('templateLogo', 'Template logo'), meta: t('templateLogoHint', 'Replace it: library or your file') + hidden }

            return { title: t('freeSlot', 'Free slot'), meta: t('freeSlotHint', 'Add a logo: library or file') }
        }

        function rowItem(kind, zone) {
            if (kind.key === 'colors') {
                const hex = zone.color || '#000000'

                return { title: zone.label, meta: zone.color ? hex.toUpperCase() + (hex === '#ffffff' || hex === '#000000' ? ' · ' + colorName(hex) : '') : '', swatch: hex, eye: '' }
            }

            if (kind.key === 'text') {
                const style = window.getComputedStyle(zone.element)
                const hex = hexOf(style.fill)

                return {
                    title: zone.content ? textOf(zone.element) : '',
                    font: style.fontFamily,
                    meta: prettyFamily(style.fontFamily) + ' · ' + Math.round(parseFloat(style.fontSize)) + (hex && !zone.hidden ? ' · ' + colorName(hex) : '') + (zone.hidden ? ' · ' + t('hidden', 'hidden') : ''),
                    eye: zone.hidden ? 'off' : 'on',
                }
            }

            const info = logoInfo(zone)

            // The eye shows or hides a logo; a free slot has nothing to hide
            return { title: info.title, meta: info.meta, eye: zone.source ? (zone.hidden ? 'off' : 'on') : '' }
        }

        let refreshing = false

        function refreshRows() {
            if (refreshing) return

            refreshing = true
            window.requestAnimationFrame(function () {
                refreshing = false
                KINDS.forEach(renderRows)
                refreshLogoEditor()
                showChosenRow()
            })
        }

        // Phone layout (under 992 px): the chosen row of the kind just selected is brought to the top of the panel, so a tap
        // on a logo, a text or a colour of the mat shows its row and its editor, wherever it is in the list
        function showChosenRow() {
            const key = rowToShow

            rowToShow = null

            if (!key || !window.matchMedia('(max-width: 991.98px)').matches) return

            const tools = $('.tools', dock)
            const row = $('[data-sx-kind="' + key + '"] .sx-row.on')

            if (!tools || !row) return

            const top = row.getBoundingClientRect().top - tools.getBoundingClientRect().top + tools.scrollTop - 8
            const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches

            tools.scrollTo({ top: Math.max(0, top), behavior: smooth ? 'smooth' : 'auto' })
        }

        // The eye of a row shows or hides its text or its logo, like the switch of the editor
        function toggleHidden(kind, zone) {
            if (kind.key === 'text') MmCustom.texts.setHidden(zone.element, !zone.hidden)
            else if (kind.key === 'logo' && zone.source) MmCustom.logos.setVisible(zone.element, !!zone.hidden)

            refreshRows()
        }

        // Click on a row: another zone is selected (its editor opens); the chosen one folds or unfolds its editor
        function toggleRow(kind, zone) {
            if (zone.element === current[kind.type] && active === kind) {
                collapsed[kind.key] = !collapsed[kind.key]

                if (collapsed[kind.key] && ui.colorPicker) ui.colorPicker.close()

                refreshRows()
            } else {
                selectZone(zone)
            }
        }

        function renderRows(kind) {
            const box = rows[kind.key]
            const editor = editors[kind.key]
            const zones = MmCustom.zones.all(kind.type)
            let buttons = $$('.sx-row', box)

            // Built once (the zones of a template do not change), refreshed on every change of the mat
            if (buttons.length !== zones.length) {
                buttons.forEach(function (b) { b.remove() })
                buttons = zones.map(function (zone, index) {
                    // A row is a button that holds another one (the eye): a <div role="button">, not a <button>
                    const button = document.createElement('div')
                    const fresh = function () { return MmCustom.zones.all(kind.type)[index] }

                    button.className = 'sx-row'
                    button.setAttribute('role', 'button')
                    button.tabIndex = 0
                    button.innerHTML = '<span class="sx-row__badge"></span><span class="sx-row__thumb"></span><span class="sx-row__main"><span class="sx-row__title"></span><span class="sx-row__meta"></span></span>'
                        + '<span class="sx-row__end"><button type="button" class="sx-row__eye" hidden></button><span class="sx-row__chev" aria-hidden="true">' + ICONS.chevron + '</span></span>'
                    button.addEventListener('click', function (event) {
                        const zone = fresh()

                        if (!zone) return

                        if (event.target.closest('.sx-row__eye')) toggleHidden(kind, zone)
                        else toggleRow(kind, zone)
                    })
                    button.addEventListener('keydown', function (event) {
                        if (event.target !== button || (event.key !== 'Enter' && event.key !== ' ')) return

                        event.preventDefault()

                        const zone = fresh()

                        if (zone) toggleRow(kind, zone)
                    })
                    box.appendChild(button)

                    return button
                })
            }

            let currentRow = null

            zones.forEach(function (zone, index) {
                const button = buttons[index]
                const item = rowItem(kind, zone)
                const on = zone.element === current[kind.type]
                const thumb = button.querySelector('.sx-row__thumb')
                const title = button.querySelector('.sx-row__title')

                const open = on && !collapsed[kind.key]
                const eyeButton = button.querySelector('.sx-row__eye')

                button.classList.toggle('on', on)
                button.classList.toggle('is-open', open)
                button.classList.toggle('is-empty', !zone.used)
                button.classList.toggle('is-hidden', !!zone.hidden)
                button.setAttribute('aria-pressed', String(on))
                button.setAttribute('aria-expanded', String(open))

                // Rewritten only when it changes: the eye keeps the focus while it is used
                if (eyeButton.dataset.state !== item.eye) {
                    eyeButton.dataset.state = item.eye
                    eyeButton.hidden = !item.eye
                    eyeButton.innerHTML = item.eye === 'off' ? ICONS.eyeOff : ICONS.eye
                    eyeButton.title = item.eye === 'off' ? t('show', 'Show') : t('hide', 'Hide')
                    eyeButton.setAttribute('aria-label', eyeButton.title)
                    eyeButton.setAttribute('aria-pressed', String(item.eye === 'off'))
                }
                button.querySelector('.sx-row__badge').textContent = zone.badge

                if (kind.key === 'colors') {
                    thumb.className = 'sx-row__thumb sx-row__thumb--swatch' + (item.swatch === '#ffffff' ? ' is-white' : '')
                    thumb.style.background = item.swatch
                } else if (kind.key === 'logo') {
                    const shown = paintThumb(thumb, zone)

                    thumb.className = 'sx-row__thumb sx-row__thumb--logo' + (shown ? '' : ' is-empty')
                } else {
                    thumb.hidden = true
                }

                title.textContent = item.title || (kind.key === 'text' ? t('emptyText', 'Empty text') : '')

                if (kind.key === 'text') title.style.fontFamily = item.font || ''

                button.querySelector('.sx-row__meta').textContent = item.meta

                if (on) currentRow = button
            })

            // The editor sits under the chosen row (moved only when needed: a field being typed in keeps the focus)
            if (currentRow) {
                if (currentRow.nextElementSibling !== editor) currentRow.after(editor)

                editor.hidden = !!collapsed[kind.key]
            } else {
                editor.hidden = true
            }

            if (phonePanel) phonePanel.chips(kind, zones)
        }

        ;['color:change', 'text:change', 'text:moved', 'logo:placed', 'logo:removed', 'logo:hidden', 'logo:text-mode', 'logo:resized', 'logo:scaled'].forEach(function (name) {
            MmCustom.on(name, refreshRows)
        })

        // Undo, reset (MmCustom.history): the mat went back to an earlier state, the rows and the tools read it again
        MmCustom.on('history:restore', function () {
            ;['color', 'text', 'logo'].forEach(function (type) { if (current[type] && !current[type].isConnected) current[type] = null })

            if (ui.colorPicker) ui.colorPicker.close()
            if (current.color) syncColor()
            if (current.text) syncText()
            if (current.logo) syncLogo()

            refreshRows()
        })

        /* ------------------------------------------------------------- repères */

        let markersOn = false
        const markersButton = $('.sx-toggle--hots')

        function showMarkers() {
            if (!ui.markers) return

            if (markersOn) ui.markers.show(active ? active.type : null)
            else ui.markers.hide()
        }

        function paintMarkersButton() {
            const label = markersOn ? t('markersHide', 'Hide the markers') : t('markers', 'Show the markers')

            markersButton.setAttribute('aria-pressed', String(markersOn))
            markersButton.title = label
            markersButton.querySelector('span').textContent = label
        }

        if (ui.markers) {
            markersButton.addEventListener('click', function () {
                markersOn = !markersOn
                paintMarkersButton()
                showMarkers()
            })
            paintMarkersButton()
        } else {
            markersButton.hidden = true
        }

        /* ------------------------------------------------------------- annuler, réinitialiser */

        const undoButton = $('.sx-hist--undo')
        const resetButton = $('.sx-hist--reset')

        if (MmCustom.history && undoButton && resetButton) {
            const paintHistory = function () {
                undoButton.disabled = !MmCustom.history.canUndo()
                resetButton.disabled = !MmCustom.history.canReset()
            }

            undoButton.addEventListener('click', function () { MmCustom.history.undo() })
            // On a phone (layout under 992 px) a window says first that the design is going back to its start; on a computer
            // the reset is immediate (it can be undone)
            const phone = window.matchMedia('(max-width: 991.98px)')
            let resetModal = null

            resetButton.addEventListener('click', function () {
                if (!phone.matches) {
                    MmCustom.history.reset()

                    return
                }

                if (!resetModal) {
                    resetModal = document.createElement('div')
                    resetModal.className = 'mm-modal-overlay mmc-exit sx-switch sx-reset'
                    resetModal.setAttribute('role', 'dialog')
                    resetModal.setAttribute('aria-modal', 'true')
                    resetModal.innerHTML = '<div class="mm-modal"><button type="button" class="save-auth-close" aria-label="' + esc(t('close', 'Close')) + '">&times;</button>'
                        + '<p class="mmc-exit__title">' + esc(t('resetTitle', 'Reset the design?')) + '</p>'
                        + '<p class="save-success-text">' + esc(t('resetText', 'All your changes will be removed: the mat goes back to the design you started from.')) + '</p>'
                        + '<div class="save-success-actions"><button type="button" class="mm-btn sx-reset__go">' + esc(t('resetGo', 'Reset')) + '</button>'
                        + '<button type="button" class="mm-btn-alt sx-reset__stay">' + esc(t('keepEditing', 'Keep editing')) + '</button></div></div>'
                    page.appendChild(resetModal)
                    closableModal(resetModal)
                    resetModal.querySelector('.sx-reset__stay').addEventListener('click', function () { closeModal(resetModal) })
                    resetModal.querySelector('.sx-reset__go').addEventListener('click', function () {
                        closeModal(resetModal)
                        MmCustom.history.reset()
                    })
                }

                openModal(resetModal)
            })
            MmCustom.on('history', paintHistory)
            paintHistory()
        } else {
            ;[undoButton, resetButton].forEach(function (b) { if (b) b.hidden = true })
        }

        /* ------------------------------------------------------------- couleurs */

        // Section titles of the module's colour blocks: Sixten's small capitals
        $$('.mmc-tool-title').forEach(function (el) { el.classList.add('mm-tools-title') })

        const colorBlock = $('[data-sx-kind="colors"]')
        const textBlock = $('[data-sx-kind="text"]')

        // One list of swatches, titled « Trends »: black and white first, then the brand colours, then the colours of the
        // template (in the colour tool and in the text colour tool). The module's own « Trends » list is not shown. Without
        // brand colours, the module's list stays and takes the template colours.
        const templateColors = MmCustom.colors.templateColors()

        $$('[data-sx-kind="text"] .font-colors, [data-sx-kind="colors"] .sx-editor').forEach(function (scope) {
            const brands = $('.colors-section-brands', scope)
            const trends = $('.colors-section-trends', scope)
            const keep = brands && brands.querySelector('.brand-color') ? brands : trends

            if (!keep) return

            const grid = $('.colors-grid', keep)
            const swatchClass = scope.closest('[data-sx-kind="text"]') ? 'font-color' : 'colors-color'
            const seen = {}
            const add = function (hex, extraClass, before) {
                if (seen[hex]) return

                const swatch = document.createElement('button')

                swatch.type = 'button'
                swatch.className = swatchClass + ' ' + extraClass
                swatch.style.backgroundColor = hex
                swatch.title = hex.toUpperCase()
                swatch.setAttribute('aria-label', swatch.title)
                grid.insertBefore(swatch, before || null)
                seen[hex] = true
            }

            if (keep === brands) {
                // Black and white lead the list (a brand colour that is black or white is then left out)
                const first = grid.firstElementChild

                $('.colors-section-title', brands).textContent = t('trends', 'Trends')
                ;['#000000', '#ffffff'].forEach(function (hex) { add(hex, 'sx-bw-color', first) })
                grid.querySelectorAll('.brand-color').forEach(function (b) { if (seen[hexOf(b.style.backgroundColor)]) b.remove() })

                if (trends) trends.hidden = true
            }

            grid.querySelectorAll('button').forEach(function (b) { seen[hexOf(b.style.backgroundColor)] = true })

            templateColors.forEach(function (hex) { add(hex, 'sx-tpl-color') })
            grid.querySelectorAll('button').forEach(function (b) { if (hexOf(b.style.backgroundColor) === '#ffffff') b.classList.add('white') })

            // Printing note under the swatches of the colour tool
            if (scope.closest('[data-sx-kind="colors"]')) {
                const note = document.createElement('p')

                note.className = 'sx-note'
                note.textContent = t('printNote', 'Custom printed colors may vary slightly from those shown on screen, depending on your display and the printing process.')
                keep.appendChild(note)
            }
        })

        // Wheel: a swatch (opens iro.js, ui/color-picker.js) and the hexadecimal code, in place of the module's button
        const wheels = {}

        $$('.colors-section-wheel').forEach(function (section) {
            const inText = !!section.closest('[data-sx-kind="text"]')
            const old = section.querySelector('.mmc-pick-color')
            const title = document.createElement('label')
            const wheel = document.createElement('div')

            title.className = 'mm-tools-title colors-section-title'
            title.textContent = t('palette', 'Palette')
            wheel.className = 'mm-wheel'
            wheel.innerHTML = '<div class="mm-wheel-preview"><button type="button" class="mm-wheel-swatch"></button><input type="text" class="mm-wheel-hex" maxlength="7" spellcheck="false" autocomplete="off"></div>'

            if (old) old.remove()

            section.append(title, wheel)

            const swatch = wheel.querySelector('.mm-wheel-swatch')
            const hex = wheel.querySelector('.mm-wheel-hex')

            swatch.title = t('colorWheel', 'Colour wheel')
            swatch.setAttribute('aria-label', swatch.title)
            hex.setAttribute('aria-label', t('colorCode', 'Colour code'))

            const apply = function (value) {
                if (inText) { if (current.text) MmCustom.texts.setFill(current.text, value) } else if (current.color) MmCustom.colors.apply(current.color, value)
            }

            swatch.addEventListener('click', function () {
                if (!ui.colorPicker) return

                ui.colorPicker.open(swatch, {
                    color: hex.value || '#ffffff',
                    onInput: function (value) {
                        apply(value)
                        paint(value)
                    },
                }).catch(function (error) { console.error('mm_custom_sixten: colour picker', error) })
            })
            hex.addEventListener('change', function () {
                const value = hex.value.trim().replace(/^([0-9a-f]{6})$/i, '#$1')

                if (/^#[0-9a-f]{6}$/i.test(value)) {
                    apply(value.toLowerCase())
                    paint(value.toLowerCase())
                } else {
                    sync()
                }
            })

            function paint(value) {
                swatch.style.backgroundColor = value || 'transparent'
                hex.value = value || ''
            }

            function sync() {
                const value = inText
                    ? (current.text ? hexOf(window.getComputedStyle(current.text).fill) : '')
                    : (current.color ? hexOf(MmCustom.colors.read(current.color)) : '')

                paint(value)
            }

            wheels[inText ? 'text' : 'color'] = { sync: sync }
        })

        function markPicked(scope, colors) {
            const wanted = colors.map(hexOf)

            $$('.picked', scope).forEach(function (s) { s.classList.remove('picked') })
            $$('.colors-color, .font-color', scope).forEach(function (s) {
                if (wanted.indexOf(hexOf(s.style.backgroundColor)) !== -1) s.classList.add('picked')
            })
        }

        function syncColor() {
            markPicked(colorBlock, MmCustom.colors.list(current.color))

            if (wheels.color) wheels.color.sync()
        }

        if (colorBlock) {
            colorBlock.addEventListener('click', function (event) {
                const swatch = event.target.closest('.colors-color')

                if (!swatch || !current.color) return

                MmCustom.colors.apply(current.color, swatch.style.backgroundColor)
                markPicked(colorBlock, [swatch.style.backgroundColor])

                if (wheels.color) wheels.color.sync()
            })
        }

        MmCustom.on('color:change', function () { if (current.color && wheels.color) wheels.color.sync() })

        /* ------------------------------------------------------------- mesures en cm (textes et logos) */

        // Template units to cm (MmCustom.product.cmPerUnit, from the size of the product); 0 when unknown
        const cmPerUnit = function () { return MmCustom.product.cmPerUnit() }
        const roundCm = function (value) { return Math.round(value * 10) / 10 }
        // Position of a text or of a logo on a computer (mountEdgeRows): left / right and up / down as the screen shows the
        // mat, as distances to the nearest edge of the mat (MmCustom.position of the engine, as the wheels of the phone): an
        // icon names the edge, « Centred » at the same distance from both. Dimension lines are drawn on the mat while a
        // figure is pointed at or typed, or an element is dragged (showGuides); on a phone the wheels own them.
        const EDGE_ART = ui.adjust && ui.adjust.icons ? ui.adjust.icons : {}
        const EDGE_NAME = {
            left: function () { return t('fromLeft', 'Distance from the left edge') },
            right: function () { return t('fromRight', 'Distance from the right edge') },
            top: function () { return t('fromTop', 'Distance from the top edge') },
            bottom: function () { return t('fromBottom', 'Distance from the bottom edge') },
        }
        const wide = window.matchMedia('(min-width: 992px)')
        let guidesTimer = 0
        const showGuides = function (el) {
            if (!MmCustom.position || !wide.matches || !el) return

            clearTimeout(guidesTimer)
            MmCustom.position.guides(el)
        }
        const hideGuides = function () {
            if (!MmCustom.position || !wide.matches) return

            clearTimeout(guidesTimer)
            guidesTimer = setTimeout(function () { if (wide.matches) MmCustom.position.guides(null) }, 1500)
        }

        MmCustom.on('drag:start', function (event) { showGuides(event.detail && event.detail.element) })
        MmCustom.on('drag:end', hideGuides)

        // A computer: the position of a text or of a logo is one line under its size (.sx-place-block, in the place of the
        // .sx-logo-pos block given): its distance to the nearest edge left / right and up / down, each a button that turns
        // into a field to type a figure in cm (Enter or leaving the field applies it, Escape cancels), then « centre left /
        // right » and the quarter turn. The height and the width of the element are a line under the size (sizeBox). On the
        // mat, the element is moved with the mouse; the figures follow.
        // options: { id, element(), usable(element), keep (stay in the printable part of the mat), sizeBox }
        function mountEdgeRows(block, options) {
            if (!block || !MmCustom.position || !MmCustom.position.measure) return { sync: function () {} }

            const turnName = MmCustom.t('adjustRotate', 'Turn a quarter turn')
            const centreName = t('centreX', 'Centre left / right')
            const dims = document.createElement('p')
            const buttons = {}
            let editing = null // axis whose figure is being typed

            block.className = 'sx-place-block'
            block.innerHTML = '<span class="mm-tools-title"></span><div class="sx-place">'
                + '<button type="button" class="sx-place__edge" data-axis="x"></button>'
                + '<button type="button" class="sx-place__edge" data-axis="y"></button>'
                + '<span class="sx-place__gap"></span>'
                + '<button type="button" class="sx-place__btn sx-place__centre"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18M3 12h5M21 12h-5M5.5 9.5L8 12l-2.5 2.5M18.5 9.5L16 12l2.5 2.5"/></svg></button>'
                + '<button type="button" class="sx-place__btn sx-place__turn"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/></svg></button></div>'
            block.querySelector('.mm-tools-title').textContent = t('toolPosition', 'Position')

            const centre = block.querySelector('.sx-place__centre')
            const turn = block.querySelector('.sx-place__turn')

            centre.title = centreName
            centre.setAttribute('aria-label', centreName)
            turn.title = turnName
            turn.setAttribute('aria-label', turnName)
            buttons.x = block.querySelector('[data-axis="x"]')
            buttons.y = block.querySelector('[data-axis="y"]')
            dims.className = 'sx-dimsline'

            if (options.sizeBox) options.sizeBox.insertAdjacentElement('afterend', dims)

            const figure = function (value) {
                if (!cmPerUnit()) return String(Math.round(value))

                return roundCm(value).toLocaleString(document.documentElement.lang || undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' cm'
            }
            const target = function () {
                const el = options.element()

                return el && el.isConnected && options.usable(el) ? el : null
            }
            const measure = function () {
                const el = target()

                try { return el ? MmCustom.position.measure(el) : null } catch (e) { return null } // not drawn
            }

            function paintButton(axis, m) {
                const b = buttons[axis]

                if (editing === axis) return

                if (!m) {
                    b.innerHTML = ''
                    b.disabled = true

                    return
                }

                const at = m[axis]
                const k = cmPerUnit() || 1
                const text = at.centred ? t('centred', 'Centred') : figure(at.gap * k)
                const name = at.centred ? (axis === 'x' ? t('offset', 'Left / right position') : t('offsetY', 'Up / down position')) + ' : ' + text : EDGE_NAME[at.edge]() + ' : ' + text

                b.disabled = false
                b.innerHTML = (EDGE_ART[at.centred ? (axis === 'x' ? 'midX' : 'midY') : at.edge] || '') + '<span>' + esc(text) + '</span>'
                b.title = name
                b.setAttribute('aria-label', name)
            }

            function sync() {
                const el = target()
                const m = measure()

                paintButton('x', m)
                paintButton('y', m)
                centre.disabled = !m
                turn.disabled = !m

                let size = null

                try { size = el && MmCustom.position.dims ? MmCustom.position.dims(el) : null } catch (e) { size = null }

                const k = cmPerUnit() || 1

                dims.hidden = !size
                dims.textContent = size
                    ? MmCustom.t('adjustHeight', 'Height') + ' × ' + MmCustom.t('adjustWidth', 'Width').toLowerCase() + ' : '
                        + figure(size.height * k).replace(/ cm$/, '') + ' × ' + figure(size.width * k)
                    : ''
            }

            // A figure typed in place of the button: from the edge the button showed
            function edit(axis) {
                const m = measure()

                if (!m || editing) return

                const at = m[axis]
                const k = cmPerUnit() || 1
                const edge = at.centred ? (axis === 'x' ? 'left' : 'top') : at.edge
                const gap = at.centred ? at.gap : (edge === at.edge ? at.gap : at.far)
                const b = buttons[axis]
                const input = document.createElement('input')
                let done = false

                editing = axis
                input.type = 'text'
                input.inputMode = 'decimal'
                input.className = 'sx-place__field'
                input.value = String(roundCm(gap * k)).replace('.', ',')
                input.setAttribute('aria-label', EDGE_NAME[edge]())
                b.innerHTML = (EDGE_ART[edge] || '')
                b.appendChild(input)
                b.insertAdjacentHTML('beforeend', cmPerUnit() ? '<i>cm</i>' : '')
                showGuides(target())
                input.focus()
                input.select()

                const finish = function (apply) {
                    if (done) return

                    done = true
                    editing = null

                    const value = parseFloat(String(input.value).replace(',', '.'))
                    const el = target()

                    if (apply && el && value >= 0) {
                        MmCustom.position.place(el, edge, value / k, { keep: !!options.keep, snapCentre: false })
                    }

                    sync()
                    hideGuides()
                }

                input.addEventListener('keydown', function (event) {
                    if (event.key === 'Enter') { event.preventDefault(); finish(true); b.focus() }
                    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); finish(false); b.focus() }
                })
                input.addEventListener('blur', function () { finish(true) })
                input.addEventListener('click', function (event) { event.stopPropagation() })
            }

            ;['x', 'y'].forEach(function (axis) {
                buttons[axis].addEventListener('click', function () { edit(axis) })
                buttons[axis].addEventListener('mouseenter', function () { showGuides(target()) })
                buttons[axis].addEventListener('mouseleave', function () { if (!editing) hideGuides() })
            })

            centre.addEventListener('click', function () {
                const el = target()
                const m = measure()

                if (!el || !m) return

                showGuides(el)
                MmCustom.position.place(el, m.x.edge, (m.x.gap + m.x.far) / 2, { keep: !!options.keep, snapCentre: false })
                sync()
                hideGuides()
            })
            turn.addEventListener('click', function () {
                const el = target()

                if (!el || !MmCustom.position.quarterTurn) return

                showGuides(el)
                MmCustom.position.quarterTurn(el, { keep: !!options.keep })
                sync()
                hideGuides()
            })

            ;['text:moved', 'text:change', 'text:rotated', 'logo:moved', 'logo:resized', 'logo:scaled', 'logo:rotated', 'logo:measured',
                'history:restore', 'stage:rotate'].forEach(function (name) { MmCustom.on(name, sync) })

            return { sync: sync }
        }

        // A figure in cm next to a slider's label: applied on Enter or when the field is left
        function numberField(id, label, onSet) {
            const box = document.createElement('span')

            box.className = 'sx-num'
            box.innerHTML = '<input type="number" inputmode="decimal" min="0.5" max="999" step="0.1"><i>cm</i>'
            box.title = label

            const input = box.querySelector('input')

            input.id = id
            input.setAttribute('aria-label', label)
            box.querySelector('i').hidden = !cmPerUnit()

            const set = function () {
                const value = parseFloat(String(input.value).replace(',', '.'))

                if (value > 0) onSet(value)
            }

            input.addEventListener('change', set)
            input.addEventListener('keydown', function (event) {
                if (event.key === 'Enter') { event.preventDefault(); set(); input.select() }
            })

            return {
                box: box,
                input: input,
                show: function (value) { if (document.activeElement !== input) input.value = value > 0 ? String(roundCm(value)) : '' },
            }
        }

        /* ------------------------------------------------------------- textes */

        const textArea = textBlock ? $('.inputTextDesign', textBlock) : null
        let fontField = null
        let textSliders = null

        function syncText() {
            if (!current.text) return

            MmCustom.texts.select(current.text, { silent: true }) // reads its matrix again (the text editor writes through it)

            markPicked(textBlock, [window.getComputedStyle(current.text).fill])

            if (wheels.text) wheels.text.sync()
            if (fontField) fontField.sync()
            if (textSliders) textSliders.sync()

            fitTextField()
        }

        if (textBlock) {
            textBlock.addEventListener('click', function (event) {
                const swatch = event.target.closest('.font-color')

                if (!swatch || !current.text) return

                MmCustom.texts.setFill(current.text, swatch.style.backgroundColor)
                markPicked(textBlock, [swatch.style.backgroundColor])

                if (wheels.text) wheels.text.sync()
            })
        }

        // Field (several lines when the text allows it): ui/text-editor.js of mm_custom. No alignment: the text is moved instead.
        // The font is chosen from the field itself; size and offset are sliders with a figure in cm, as for the logos.
        let editor = null

        if (textArea && ui.textEditor) {
            editor = ui.textEditor.mount(textArea, { text: true, align: false, size: false, fonts: [] })
        }

        if (editor) {
            const root = editor.root
            const bar = root.querySelector('.mmc-text-editor__bar')
            const align = root.querySelector('.mmc-text-editor__align')
            const field = root.querySelector('textarea')
            const foot = textArea.querySelector('.sx-text-foot')

            textArea.insertBefore(root, foot)
            bar.classList.add('sx-text-bar')

            if (align) {
                align.className = 'sx-text-bar__align'
                align.querySelectorAll('button').forEach(function (b) {
                    b.className = ''
                    b.innerHTML = ICONS[b.dataset.align] || b.textContent
                })
            }

            let fonts = []

            try { fonts = JSON.parse(textArea.dataset.mmcFonts || '[]') } catch (e) { fonts = [] }

            if (field) {
                field.classList.remove('form-control')
                field.placeholder = t('yourText', 'Your text')
                field.addEventListener('input', fitTextField)

                if (fonts.length) fontField = mountFontField(field, fonts)
            }

            textSliders = mountTextSliders(textArea, foot)
        }

        // Size of the text (height of its capitals, in cm) and its position (mountEdgeRows), built like the logo's sliders
        function mountTextSliders(container, before) {
            const box = document.createElement('div')

            box.className = 'sx-logo-sliders sx-text-sliders'
            box.innerHTML = '<div class="sx-logo-size"><div class="logo-design">'
                + '<label class="mm-tools-title" for="sx-text-size"></label>'
                + '<input type="range" id="sx-text-size" min="1" max="40" step="0.5" value="5">'
                + '</div></div>'
                + '<div class="sx-logo-pos"><div class="sx-logo-pos__row">'
                + '<span class="mm-tools-title" id="sx-text-pos-label"></span><span class="sx-logo-pos__val">0</span>'
                + '</div><input type="range" min="0" max="100" step="0.1" value="0" aria-labelledby="sx-text-pos-label"></div>'
            container.insertBefore(box, before)

            const design = box.querySelector('.logo-design')
            const slider = box.querySelector('#sx-text-size')
            const edges = mountEdgeRows(box.querySelector('.sx-logo-pos'), {
                id: 'sx-text-pos',
                element: function () { return current.text },
                usable: function (el) { return MmCustom.texts.isMovable(el) },
                keep: true, // as the size: a text stays in the printable part of the mat
                sizeBox: box.querySelector('.sx-logo-size'),
            })
            const number = numberField('sx-text-size-cm', t('textSizeCm', 'Height of the capital letters, in cm'), function (cm) { setCm(cm) })

            box.querySelector('label').textContent = t('sizeShort', 'Size')
            box.querySelector('label').title = t('textSize', 'Text size')
            design.insertBefore(number.box, slider)

            // Height of the capitals in cm (MmCustom.texts.capHeight: across the baseline, a slanted number keeps its height)
            const sizeCm = function (el) { return MmCustom.texts.capHeight(el) * (cmPerUnit() || 1) }

            // A text the sliders make larger or move stays in the printable part of the mat (MmCustom.drag.keepInside, as
            // the drag); too large, it is centred
            function setCm(cm) {
                const el = current.text

                if (!el) return

                MmCustom.texts.setCapHeight(el, cm / (cmPerUnit() || 1))
                MmCustom.drag.keepInside(el)
                sync()
                number.input.value = String(roundCm(sizeCm(el))) // what was drawn (the slot may hold the text smaller)
            }

            slider.addEventListener('input', function () { setCm(parseFloat(slider.value)) })

            function sync() {
                const el = current.text

                if (!el || !el.isConnected) return

                let cm = 0

                try {
                    cm = sizeCm(el)
                } catch (e) {
                    return // not drawn (hidden step): read again when shown
                }

                number.show(cm)

                if (document.activeElement !== slider) {
                    if (cm > parseFloat(slider.max)) slider.max = String(Math.ceil(cm))
                    if (cm < parseFloat(slider.min)) slider.min = String(Math.floor(cm * 2) / 2)
                    slider.value = String(cm)
                }

                edges.sync()
            }

            ;['text:moved', 'text:change'].forEach(function (name) {
                MmCustom.on(name, function (event) { if (event.detail && event.detail.element === current.text) sync() })
            })

            // A font that finishes loading changes the height of the capitals
            if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', sync)

            return { sync: sync }
        }

        function fitTextField() {
            const field = textArea && textArea.querySelector('.mmc-text-editor textarea')

            if (!field || !current.text) return

            const max = MmCustom.texts.maxLines(current.text)
            const lines = Math.min(max, Math.max(1, field.value.split('\n').length))

            field.rows = lines
            body.classList.toggle('sx-text-multi', lines > 1 || !!MmCustom.texts.slotOf(current.text))
        }

        // Font chosen in the text field itself: the field writes the text in its font, and the list of the fonts (each one
        // writing the text being typed) unrolls under it as soon as it is used; the font name and ▾ at its right toggle it
        function mountFontField(field, fonts) {
            const wrap = document.createElement('div')
            const button = document.createElement('button')
            const list = document.createElement('ul')

            wrap.className = 'sx-textfield'
            field.parentNode.insertBefore(wrap, field)
            wrap.appendChild(field)

            button.type = 'button'
            button.className = 'sx-textfield__font'
            button.setAttribute('aria-haspopup', 'listbox')
            button.setAttribute('aria-expanded', 'false')
            button.setAttribute('aria-controls', 'sx-fontlist')
            button.innerHTML = '<span></span>' + ICONS.chevron
            wrap.appendChild(button)

            const name = button.querySelector('span')

            list.className = 'sx-fontlist'
            list.id = 'sx-fontlist'
            list.setAttribute('role', 'listbox')
            list.setAttribute('aria-label', t('font', 'Font'))
            list.hidden = true

            fonts.forEach(function (font) {
                const item = document.createElement('li')
                const sample = document.createElement('span')
                const label = document.createElement('small')

                item.setAttribute('role', 'option')
                item.tabIndex = -1
                item.dataset.font = font
                sample.className = 'sx-fontlist__sample'
                sample.style.fontFamily = '"' + font + '"'
                label.textContent = prettyFamily(font)
                item.append(sample, label)
                list.appendChild(item)
            })

            document.body.appendChild(list) // a fixed layer above everything: the tools column clips its content

            const isOpen = function () { return !list.hidden }
            const inside = function (node) { return !!node && (wrap.contains(node) || list.contains(node)) }

            const place = function () {
                const rect = wrap.getBoundingClientRect()
                const vv = window.visualViewport
                const bottom = vv ? vv.offsetTop + vv.height : window.innerHeight
                const below = bottom - rect.bottom - 12
                const above = rect.top - 12
                const down = below >= 200 || below >= above
                const room = Math.max(140, Math.min(down ? below : above, 380))

                list.style.cssText = 'left:' + rect.left + 'px;width:' + rect.width + 'px;max-height:' + room + 'px;'
                    + (down ? 'top:' + (rect.bottom - 1.5) + 'px' : 'bottom:' + (window.innerHeight - rect.top - 1.5) + 'px')
                list.classList.toggle('is-up', !down)
            }

            const open = function () {
                if (isOpen() || !current.text) return

                sync()
                list.hidden = false
                wrap.classList.add('is-open')
                button.setAttribute('aria-expanded', 'true')
                place()

                const selected = list.querySelector('[aria-selected="true"]')

                if (selected) list.scrollTop = selected.offsetTop - list.clientHeight / 2 + selected.offsetHeight / 2
            }
            const handle = { onClose: null } // onClose: told when the list closes (phone tool of the fonts)
            const close = function (focusField) {
                if (!isOpen()) return

                list.hidden = true
                wrap.classList.remove('is-open')
                button.setAttribute('aria-expanded', 'false')

                if (focusField === true) field.focus()
                if (handle.onClose) handle.onClose()
            }

            const sync = function () {
                const family = current.text ? familyOf(window.getComputedStyle(current.text).fontFamily) : ''
                const text = (textOf(current.text) || 'Aa Bb 123').slice(0, 40)

                field.style.fontFamily = family ? '"' + family + '", var(--mmx-caps)' : ''
                name.textContent = family ? prettyFamily(family) : t('font', 'Font')
                button.title = t('font', 'Font') + (family ? ' : ' + prettyFamily(family) : '')
                button.setAttribute('aria-label', button.title)
                list.querySelectorAll('li').forEach(function (item) {
                    item.firstChild.textContent = text
                    item.setAttribute('aria-selected', String(item.dataset.font.toLowerCase() === family.toLowerCase()))
                })
            }

            // With a keyboard on screen (phone, tablet: narrow layout or finger as main pointer), the list never opens by
            // itself: it would cover the field, the mat and the tools while the keyboard hides the rest. There, the field is
            // only for typing and the list opens from the font button, keyboard closed.
            const onScreenKeyboard = function () { return window.matchMedia('(max-width: 991.98px), (pointer: coarse)').matches }

            // Elsewhere the list unrolls by itself when the field is used, and stays open while typing (the samples follow
            // the text)
            const openFromField = function () {
                if (onScreenKeyboard()) close()
                else open()
            }

            field.addEventListener('focus', openFromField)
            field.addEventListener('click', openFromField)
            field.addEventListener('keydown', function (event) {
                if (event.key === 'Escape' && isOpen()) { event.preventDefault(); event.stopPropagation(); close() }
                else if (event.key === 'ArrowDown' && field.selectionStart === field.value.length) {
                    open()

                    const target = list.querySelector('[aria-selected="true"]') || list.firstElementChild

                    if (target) { event.preventDefault(); target.focus() }
                }
            })

            // Clicks on ▾ and in the list keep the focus where it is (a computer: in the field, typing goes on)
            button.addEventListener('mousedown', function (event) { event.preventDefault() })
            list.addEventListener('mousedown', function (event) { event.preventDefault() })
            button.addEventListener('click', function () {
                if (isOpen()) { close(); return }

                // On-screen keyboard: it goes away first (the list takes its room), then the list opens and is placed again
                // when the visible part of the page has grown back (visualViewport resize, below)
                if (onScreenKeyboard() && document.activeElement === field) field.blur()

                open()
            })

            list.addEventListener('keydown', function (event) {
                const items = Array.from(list.children)
                const at = items.indexOf(document.activeElement)
                let next = null

                if (event.key === 'ArrowDown') next = items[Math.min(items.length - 1, at + 1)]
                else if (event.key === 'ArrowUp') next = at <= 0 ? null : items[at - 1]
                else if (event.key === 'Home') next = items[0]
                else if (event.key === 'End') next = items[items.length - 1]
                else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); if (items[at]) choose(items[at]); return }
                else if (event.key === 'Escape') { event.preventDefault(); close(true); return }
                else if (event.key === 'Tab') { close(); return }

                if (event.key === 'ArrowUp' && at <= 0) { event.preventDefault(); field.focus(); return }
                if (next) { event.preventDefault(); next.focus() }
            })

            list.addEventListener('click', function (event) {
                const item = event.target.closest('li')

                if (item) choose(item)
            })

            function choose(item) {
                if (!current.text) return

                const element = current.text
                const font = item.dataset.font

                MmCustom.texts.setFont(element, font)

                // Phone tool of the fonts (mountPhonePanels): the row stays, several fonts are tried before the tick
                if (!body.classList.contains('sx-ttool--font')) close()

                sync()

                // Back to typing on a computer; with an on-screen keyboard the mat stays in view, the keyboard stays down
                if (!onScreenKeyboard() && document.activeElement !== field) field.focus({ preventScroll: true })

                // The new glyphs change the line spacing and the slot fit: measure again once the font is loaded
                const refit = function () {
                    if (element.querySelector('tspan')) MmCustom.texts.setLines(element, MmCustom.texts.lines(element))
                    if (textSliders) textSliders.sync()
                }

                if (document.fonts && document.fonts.load) {
                    Promise.race([document.fonts.load('100px "' + font + '"', 'Hg'), new Promise(function (r) { setTimeout(r, 2500) })]).then(refit, refit)
                }
            }

            // Closed when the focus or a click goes elsewhere
            wrap.addEventListener('focusout', function (event) { if (!inside(event.relatedTarget)) close() })
            list.addEventListener('focusout', function (event) { if (!inside(event.relatedTarget)) close() })
            document.addEventListener('click', function (event) { if (isOpen() && !inside(event.target)) close() })
            document.addEventListener('scroll', function (event) { if (isOpen() && event.target !== list) place() }, true)
            window.addEventListener('resize', function () { if (isOpen()) place() })
            if (window.visualViewport) window.visualViewport.addEventListener('resize', function () { if (isOpen()) place() })
            MmCustom.on('text:change', function (event) { if (event.detail.element === current.text) sync() })
            MmCustom.on('select', function (event) { if (!event.detail || event.detail.type !== 'text') close() })

            handle.sync = sync
            handle.close = close
            handle.open = open
            handle.list = list

            return handle
        }

        /* ------------------------------------------------------------- logos */

        const logoBlock = $('[data-sx-kind="logo"]')
        const libraryModal = document.getElementById('modal-logos-library')
        const choiceModal = document.getElementById('modal-logo-choice')
        let refreshLogoEditor = function () {}
        let syncLogo = function () {}

        closableModal(choiceModal)
        closableModal(libraryModal)

        if (ui.library && libraryModal) ui.library.mount(document.getElementById('modal-logos-library-content'))

        if (logoBlock) {
            const thumb = $('.sx-thumb', logoBlock)
            const metaName = $('.sx-meta b', logoBlock)
            const metaFrom = $('.sx-meta small', logoBlock)
            const removeButton = $('.sx-remove', logoBlock)
            const sizeBox = $('.logo-design', logoBlock)
            const sizeSlider = $('.slider-logo-size', logoBlock)
            const tooBig = $('.sx-logo-hint', logoBlock)

            // « Logo larger than its slot » is gone: the stage reminds of what sticks out of the print area (mountPrintWarn)
            if (tooBig) tooBig.remove()
            const drop = $('.sx-drop', logoBlock)
            const dropTitle = drop ? drop.querySelector('strong') : null
            const emptyThumb = thumb.innerHTML
            const emptyName = metaName.textContent
            const emptyFrom = metaFrom.textContent
            let pending = null // name and origin of the logo being placed

            // Logo drawn in the template (not placed by the customer): its size and its offset are its free transform
            const freeOf = function (logo) { return logo && MmCustom.logos.freeTransform ? MmCustom.logos.freeTransform(logo) : null }
            const sizeOfFree = function (free) { return Math.round((free.s - 1) * 100) }
            const widen = function (value) {
                if (value > parseFloat(sizeSlider.max)) sizeSlider.max = String(value)
                if (value < parseFloat(sizeSlider.min)) sizeSlider.min = String(value)
            }

            // Position of the logo: as on the phone, it may go up to the edge of the mat
            const logoEdges = mountEdgeRows($('.sx-logo-pos', logoBlock), {
                id: 'sx-logo-pos',
                element: function () { return current.logo },
                usable: function (logo) { return MmCustom.logos.isPlaced(logo) || !!freeOf(logo) },
                keep: false,
                sizeBox: $('.sx-logo-size', logoBlock),
            })

            // Short names, as for the texts: the four lines of the panel share one column of names
            $$('.sx-logo-size .mm-tools-title', logoBlock).forEach(function (title) {
                title.title = title.textContent.trim()
                title.textContent = t('sizeShort', 'Size')
            })

            // Width of the logo in cm (MmCustom.logos.width: its own width, a logo turned on a side slot keeps it), set from
            // a figure (MmCustom.logos.setWidth)
            const widthCm = function (logo) { return MmCustom.logos.width(logo) * (cmPerUnit() || 1) }
            const setWidthCm = function (cm) {
                const logo = current.logo

                if (!logo || !MmCustom.logos.setWidth(logo, cm / (cmPerUnit() || 1))) return

                syncLogo()
                logoNumber.input.value = String(roundCm(widthCm(logo))) // what was drawn
            }
            const logoNumber = numberField('sx-logo-size-cm', t('logoSizeCm', 'Width of the logo, in cm'), setWidthCm)

            sizeBox.insertBefore(logoNumber.box, sizeSlider)

            const showWidth = function () {
                const logo = current.logo

                try {
                    logoNumber.show(logo && (freeOf(logo) || MmCustom.logos.isPlaced(logo)) ? widthCm(logo) : 0)
                } catch (e) { /* not drawn */ }
            }

            refreshLogoEditor = function () {
                const logo = current.logo
                const placed = !!logo && MmCustom.logos.isPlaced(logo)
                const shown = placed || !!freeOf(logo) // a logo of the template has its size and its offset too
                const zone = logo ? MmCustom.zones.all('logo').find(function (z) { return z.element === logo }) : null

                if (dropTitle) dropTitle.textContent = shown ? t('dropNew', 'Drop a new logo') : t('dropLogo', 'Drop your logo here')

                thumb.classList.toggle('sx-thumb--empty', !shown)
                sizeBox.classList.toggle('hide', !shown)
                logoEdges.sync()
                removeButton.hidden = !MmCustom.logos.canRemove(logo)

                // A logo of a creation reopened from 2.x has no known slot: it cannot be replaced here (it can be removed
                // from the mat, resized, moved), so the library and the drop zone are not offered for it
                const noSlot = placed && !MmCustom.logos.slotBox(logo)

                $$('.sx-logo--library, .sx-logo--import, .sx-logo-btns', logoBlock).forEach(function (box) { box.hidden = noSlot })

                if (!shown || !zone) {
                    thumb.dataset.thumb = ''
                    thumb.innerHTML = emptyThumb
                    metaName.textContent = emptyName
                    metaFrom.textContent = emptyFrom

                    return
                }

                paintThumb(thumb, zone)
                showWidth()

                const info = logoInfo(zone)

                metaName.textContent = info.title
                metaFrom.textContent = info.meta
            }

            syncLogo = function () {
                const logo = current.logo

                const free = freeOf(logo)

                if (free || MmCustom.logos.isPlaced(logo)) {
                    const value = free ? sizeOfFree(free) : MmCustom.logos.sizeOf(logo)

                    widen(value)
                    sizeSlider.value = value
                }

                refreshLogoEditor()
            }

            ;['logo:moved', 'logo:rotated', 'logo:measured'].forEach(function (name) { MmCustom.on(name, refreshRows) })

            // A new logo becomes the current one; its name and origin are kept for the rows
            MmCustom.on('logo:placed', function (event) {
                const logo = event.detail.element

                if (!MmCustom.logos.isPlaced(logo)) return

                if (pending) {
                    logoMeta[logo.id] = pending
                    pending = null
                }

                current.logo = logo
                syncLogo()
                refreshRows()
            })

            MmCustom.on('logo:removed', function (event) {
                delete logoMeta[event.detail.element.id]

                if (event.detail.removed === current.logo) current.logo = event.detail.element

                syncLogo()
            })

            // The handles may go beyond the slider's range: it widens
            MmCustom.on('logo:resized', function (event) {
                const value = event.detail.size

                if (event.detail.element !== current.logo || String(value) === sizeSlider.value) return

                if (value > parseFloat(sizeSlider.max)) sizeSlider.max = String(value)
                if (value < parseFloat(sizeSlider.min)) sizeSlider.min = String(value)

                sizeSlider.value = value
                showWidth()
            })

            // The handles scale a logo of the template: the slider follows
            MmCustom.on('logo:scaled', function (event) {
                const free = event.detail.element === current.logo ? freeOf(current.logo) : null

                if (!free) return

                showWidth()

                if (document.activeElement === sizeSlider) return

                widen(sizeOfFree(free))
                sizeSlider.value = sizeOfFree(free)
            })

            sizeSlider.addEventListener('input', function () {
                const free = freeOf(current.logo)

                // Logo of the template: the slider value is its scale (0 = as drawn, 100 = twice as big)
                if (free) MmCustom.logos.scaleBy(current.logo, Math.max(0.05, 1 + parseFloat(sizeSlider.value) / 100) / free.s)
                else if (current.logo) MmCustom.logos.resize(current.logo, sizeSlider.value)

                showWidth()
            })

            removeButton.addEventListener('click', function () {
                const fresh = MmCustom.logos.remove(current.logo)

                if (fresh) MmCustom.zones.select(MmCustom.zones.of(fresh))
            })

            const notPlaced = function (error) {
                pending = null
                console.error('mm_custom_sixten: logo not placed', error)
                window.alert(t('logoNotPlaced', 'The logo could not be placed. Choose a logo slot on the mat, then try again.'))
            }

            // Library: the button opens the module's window; a logo placed from it in the current slot
            $('.sx-lib-btn', logoBlock).addEventListener('click', function () { openModal(libraryModal) })

            // On a phone (nothing to drop): two buttons, the library then the file picker of the drop zone
            const phoneLibrary = $('.sx-logo-btn--library', logoBlock)
            const phoneUpload = $('.sx-logo-btn--upload', logoBlock)

            if (phoneLibrary) phoneLibrary.addEventListener('click', function () { openModal(libraryModal) })
            if (phoneUpload && drop) phoneUpload.addEventListener('click', function () { drop.click() })

            if (libraryModal) {
                $$('.logos-block img', libraryModal).forEach(function (img) {
                    img.addEventListener('click', function () {
                        const src = img.getAttribute('data-src') || img.getAttribute('src')

                        closeModal(libraryModal)
                        pending = { name: logoLabel(img.getAttribute('alt') || src), from: t('fromLibrary', 'From the library') }
                        MmCustom.logos.placeLibrary(src).catch(notPlaced)
                    })
                })
            }

            // Import: drop zone (click, keyboard, drag and drop of a file; ui/logo-drop.js)
            const importFile = function (file) {
                if (!file) return

                const check = MmCustom.upload.validate(file)

                if (!check.ok) {
                    window.alert(MmCustom.t(check.error, check.error))

                    return
                }

                pending = { name: prettyFile(file.name), from: t('imported', 'Imported') }
                MmCustom.upload.logStat(file, check.extension)
                MmCustom.upload.read(file)
                    .then(function (image) { return MmCustom.logos.placeImage(image) })
                    .catch(notPlaced)
            }

            if (drop && ui.logoDrop) ui.logoDrop.attach(drop, importFile)
        }

        /* ------------------------------------------------------------- téléphone : ajuster la position (trois roues) */

        // Phone (layout under 992 px): the size and offset sliders of a text or of a logo give way to one button, « Adjust
        // the position ». It opens the three wheels of the engine (MmCustom.ui.adjust: distance to the nearest edge of the
        // mat on the first two, size on the third, dimension lines on the mat) and hides the header, the panel and the
        // tabs (body.sx-adjusting): the mat takes the screen, the wheels under it. Sixten keeps the look (classes
        // .sx-adjust…, site.css) and its labels. As the sliders, a text stays in the printable part of the mat; a logo
        // may go up to its edge. The arrow puts the element back as it was when the wheels opened, the tick keeps it;
        // both bring the panel back. An engine without MmCustom.ui.adjust (mm_custom before it): no button, the sliders
        // stay.
        ;(function mountAdjust() {
            const phone = window.matchMedia('(max-width: 991.98px)')
            const container = $('.module-container')
            const ART_MOVE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18M3 12h18M9 6l3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3"/></svg>'

            if (!container || !ui.adjust || !MmCustom.texts || !MmCustom.logos) return

            const wheels = ui.adjust.mount(container, {
                prefix: 'sx-adjust',
                bodyClass: 'sx-adjusting',
                enabled: function () { return phone.matches },
                keepInside: ['text'],
                labels: {
                    offsetX: t('offset', 'Left / right position'),
                    offsetY: t('offsetY', 'Up / down position'),
                    fromLeft: t('fromLeft', 'Distance from the left edge'),
                    fromRight: t('fromRight', 'Distance from the right edge'),
                    fromTop: t('fromTop', 'Distance from the top edge'),
                    fromBottom: t('fromBottom', 'Distance from the bottom edge'),
                    centred: t('centred', 'Centred'),
                    textSize: t('textSizeCm', 'Height of the capital letters, in cm'),
                    logoSize: t('logoSizeCm', 'Width of the logo, in cm'),
                    ok: t('adjustOk', 'Confirm'),
                    back: t('adjustBack', 'Cancel'),
                },
                // The sliders of the panel follow, the mat follows the element when zoomed on its zone
                onChange: function (kind, el) {
                    if (kind === 'text' && textSliders) textSliders.sync()
                    if (kind === 'logo') syncLogo()
                    if (phonePanel) phonePanel.follow(el)
                },
            })

            if (!wheels) return

            const buttons = {} // kind -> its « Adjust the position » button

            // One button per kind, after its sliders (which the phone layout hides)
            const paintButtons = function () {
                Object.keys(buttons).forEach(function (kind) { buttons[kind].disabled = !wheels.usable(kind, current[kind]) })
            }
            const button = function (kind, sliders) {
                if (!sliders) return

                const b = document.createElement('button')

                b.type = 'button'
                b.className = 'sx-adjust-btn'
                b.innerHTML = ART_MOVE + '<span>' + esc(t('adjust', 'Adjust the position')) + '</span>'
                b.addEventListener('click', function () { wheels.open(kind, current[kind]) })
                sliders.insertAdjacentElement('afterend', b)
                buttons[kind] = b
            }

            button('text', textArea ? textArea.querySelector('.sx-text-sliders') : null)
            button('logo', logoBlock ? logoBlock.querySelector('.sx-logo-sliders') : null)

            ;['select', 'text:moved', 'text:change', 'logo:moved', 'logo:resized', 'logo:scaled', 'logo:measured', 'logo:placed', 'logo:removed', 'history:restore'].forEach(function (name) {
                MmCustom.on(name, paintButtons)
            })

            const leave = function () { if (!phone.matches) wheels.close(true) }

            if (phone.addEventListener) phone.addEventListener('change', leave)
            else if (phone.addListener) phone.addListener(leave)

            paintButtons()
        })()

        /* ------------------------------------------------------------- rappel : hors de la zone d'impression */

        // A text or a logo that the customer has moved, resized, turned, typed or placed and that sticks out of the print
        // area (the drawing less its sole: MmCustom.position.outside) gets a reminder laid on the stage, on a phone as on a
        // computer. It takes the place of « Logo larger than its slot » of the logo panel. A press on it chooses the
        // element. What the template draws is not checked as long as it is left as drawn.
        ;(function mountPrintWarn() {
            const viewport = $('.sx-viewport')

            if (!viewport || !MmCustom.position || !MmCustom.position.outside) return

            const touched = new Set()
            const warn = document.createElement('button')
            let culprit = null
            let timer = 0

            warn.type = 'button'
            warn.className = 'sx-printwarn'
            warn.hidden = true
            warn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4l9 16H3zM12 10v5M12 17.5v.5"/></svg>'
                + '<span>' + esc(t('outsidePrint', 'Outside the print area')) + '</span>'
            viewport.appendChild(warn)

            const seen = function (el) {
                if (el.tagName === 'text') return MmCustom.texts.isMovable(el)

                return el.style.opacity !== '0' && window.getComputedStyle(el).display !== 'none'
            }
            const check = function () {
                culprit = null
                touched.forEach(function (el) {
                    if (!el.isConnected) {
                        touched.delete(el)
                    } else if (!culprit && seen(el) && MmCustom.position.outside(el)) {
                        culprit = el
                    }
                })
                warn.hidden = !culprit
            }
            const soon = function () {
                clearTimeout(timer)
                timer = setTimeout(check, 120)
            }

            ;['text:moved', 'text:change', 'text:rotated', 'logo:moved', 'logo:resized', 'logo:scaled', 'logo:rotated', 'logo:placed'].forEach(function (name) {
                MmCustom.on(name, function (event) {
                    const el = event.detail && event.detail.element

                    if (el && el.nodeType === 1) touched.add(el)

                    soon()
                })
            })
            ;['logo:removed', 'logo:hidden', 'history:restore'].forEach(function (name) { MmCustom.on(name, soon) })

            warn.addEventListener('click', function () {
                const zone = culprit && MmCustom.zones.of ? MmCustom.zones.of(culprit) : null

                if (zone) MmCustom.zones.select(zone)
            })
        })()

        /* ------------------------------------------------------------- téléphone : boutons de la scène (annuler, « … ») */

        // Phone (layout under 992 px): of the buttons laid on the stage, only « undo » stays, over a « … » button that
        // unfolds the others as a menu, each with its name: markers, image, Instagram story, reset, then « Quit », which
        // presses the × of the header (hidden while a panel is open; the exit guard asks before unsaved changes are
        // lost). A choice, a tap elsewhere or Escape folds it back. On a computer the five buttons stay in their row,
        // without « … » nor « Quit ».
        ;(function mountStageMore() {
            const hint = $('.sx-stage-hint')

            if (!hint) return

            const more = document.createElement('button')

            more.type = 'button'
            more.className = 'sx-shot sx-more'
            more.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h.01M12 12h.01M19 12h.01"/></svg>'
            more.setAttribute('aria-label', t('more', 'More tools'))
            more.setAttribute('aria-expanded', 'false')
            hint.appendChild(more)

            const exit = document.querySelector('.module-top-bar .sx-config-close')

            if (exit) {
                const quit = document.createElement('button')

                quit.type = 'button'
                quit.className = 'sx-shot sx-quit'
                quit.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 4H5v16h5M15 8l4 4-4 4M19 12H9"/></svg>'
                    + '<span class="sx-more__label">' + esc(t('moreQuit', 'Quit')) + '</span>'
                quit.addEventListener('click', function () { exit.click() })
                hint.appendChild(quit)
            }

            // The name of each button in the menu (the markers button has its own, which says what it will do)
            ;[['.sx-shot:not(.sx-shot--story):not(.sx-hist):not(.sx-more)', t('moreImage', 'Image')], ['.sx-shot--story', t('moreStory', 'Instagram story')], ['.sx-hist--reset', t('resetGo', 'Reset')]].forEach(function (item) {
                const b = $(item[0], hint)

                if (!b) return

                const label = document.createElement('span')

                label.className = 'sx-more__label'
                label.textContent = item[1]
                b.appendChild(label)
            })

            const set = function (open) {
                hint.classList.toggle('is-open', open)
                more.setAttribute('aria-expanded', String(open))
            }

            more.addEventListener('click', function () { set(!hint.classList.contains('is-open')) })
            hint.addEventListener('click', function (event) { if (!event.target.closest('.sx-more')) set(false) })
            document.addEventListener('click', function (event) { if (!hint.contains(event.target)) set(false) })
            document.addEventListener('keydown', function (event) { if (event.key === 'Escape') set(false) })
            hint.classList.add('sx-has-more') // the style sheet folds the buttons only once the menu is there
        })()

        /* ------------------------------------------------------------- téléphone : volets en pastilles (couleurs, textes, logos) */

        // Phone (layout under 992 px, body.sx-chips): the header of the panel, the list of the zones and their editor give
        // way to a strip of chips (one per zone; the eye of the chosen text or logo at its right) over one row of tools:
        //  - colours: one tool, the palette: the swatches on several lines, then the custom colour (the wheel and its
        //    code, typed in a field that comes just over the keyboard), in a sheet under the mat;
        //  - texts: four tools (text, font, colour, position). The first three take the place of the tabs and the panel,
        //    with a tick to come back: the field just over the keyboard, the mat above it (visualViewport); the fonts in
        //    a grid under the mat, each one writing the text; the same palette as for the colours;
        //  - logos: four tools (library, file, position, remove), which press the buttons of the editor.
        // « Position » opens the three wheels (mountAdjust). While the panel shows the texts or the logos, the mat zooms on
        // the zone of the chosen one (twice the whole mat at most), turned upright under a text, and follows it under the
        // wheels; it shows the whole mat
        // for the colours and when the panel closes. One button on the stage goes from the zone to the whole mat and
        // back, and remembers the choice: once the whole mat is asked for, a selection no longer zooms.
        ;(function mountPhonePanels() {
            const phone = window.matchMedia('(max-width: 991.98px)')
            const still = window.matchMedia('(prefers-reduced-motion: reduce)')
            const container = $('.module-container')

            if (!container || !KINDS.length || !MmCustom.stage) return

            const SVG = function (path) { return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + path + '"/></svg>' }
            const ART = {
                text: SVG('M3 7h18v10H3zM7 10.5h.01M11 10.5h.01M15 10.5h.01M8 14h8'),
                font: SVG('M3 18L8 6l5 12M5 14h6M21 18v-6M21 15a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0'),
                color: SVG('M12 3.5s6 6.2 6 10.5a6 6 0 0 1-12 0c0-4.3 6-10.5 6-10.5z'),
                position: SVG('M12 3v18M3 12h18M9 6l3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3'),
                library: SVG('M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM3 10h18M9 4v16'),
                upload: SVG('M12 16V4m0 0l-4 4m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2'),
                remove: SVG('M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3'),
                ok: SVG('M5 12.5l4.5 4.5L19 7.5'),
                whole: SVG('M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5'),
                zone: SVG('M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM20 20l-4.9-4.9M10.5 8v5M8 10.5h5'),
                cart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2.2l2.3 11h10l2-8H6.3"/><circle cx="9.5" cy="19" r="1.4"/><circle cx="16.5" cy="19" r="1.4"/></svg>',
                save: SVG('M5 3h11l3 3v15H5zM8 3v5h7V3M8 21v-7h8v7'),
            }
            const ZOOM_MAX = 2 // times the whole mat, on the zone of the chosen text or logo
            const EDGE = 72 // px the edge of the zoomed mat may come inside the view: an element of the border clears the buttons
            const textKind = KINDS.find(function (k) { return k.key === 'text' }) || null
            const logoKind = KINDS.find(function (k) { return k.key === 'logo' }) || null
            const field = textArea ? textArea.querySelector('.sx-textfield textarea') || textArea.querySelector('.mmc-text-editor textarea') : null
            const zonesOf = function (kind) { return MmCustom.zones.all(kind.type) }
            const usable = function () { return !!current.text && current.text.isConnected }
            const twice = function (run) { window.requestAnimationFrame(function () { window.requestAnimationFrame(run) }) }

            /* chips: one per zone; the eye shows or hides the chosen text or logo */
            const strips = {}

            KINDS.forEach(function (kind) {
                if (!rows[kind.key]) return

                const box = document.createElement('div')

                box.className = 'sx-tchips sx-tchips--' + kind.key
                box.innerHTML = '<div class="sx-tchips__list" role="listbox"></div><button type="button" class="sx-tchips__eye" hidden></button>'
                rows[kind.key].parentNode.insertBefore(box, rows[kind.key])
                box.firstChild.setAttribute('aria-label', kind.label)
                box.lastChild.addEventListener('click', function () {
                    const zone = zonesOf(kind).find(function (z) { return z.element === current[kind.type] })

                    if (zone) toggleHidden(kind, zone)
                })
                strips[kind.key] = { list: box.firstChild, eye: box.lastChild }
            })

            /* tools: a row of buttons at the top of an editor */
            const toolRow = function (key, items, run) {
                const row = document.createElement('div')
                const map = {}

                row.className = 'sx-ttools sx-ttools--' + key
                items.forEach(function (item) {
                    const b = document.createElement('button')

                    b.type = 'button'
                    b.innerHTML = ART[item[0]] + '<span>' + esc(item[1]) + '</span>'
                    b.addEventListener('click', function () { run(item[0]) })
                    row.appendChild(b)
                    map[item[0]] = b
                })
                editors[key].insertBefore(row, editors[key].firstChild)

                return map
            }

            // Texts: text, font and colour take the panel (enter, below); position opens the three wheels
            const textAdjust = textArea ? textArea.querySelector('.sx-adjust-btn') : null
            const textTools = textKind && field && editors.text ? toolRow('text', [
                ['text', t('toolText', 'Text')], ['font', t('font', 'Font')], ['color', t('toolColor', 'Colour')], ['position', t('toolPosition', 'Position')],
            ], function (name) {
                if (name === 'position') { if (textAdjust) textAdjust.click() }
                else enter(name)
            }) : null

            function paintTextTools() {
                if (!textTools) return

                const on = usable()

                textTools.text.disabled = !on
                textTools.font.disabled = !on || !fontField
                textTools.color.disabled = !on
                textTools.position.disabled = !on || !textAdjust || !MmCustom.texts.isMovable(current.text)
            }

            // Colours: one tool, the palette, which takes the panel as the tools of the texts do
            const colorKind = KINDS.find(function (k) { return k.key === 'colors' }) || null
            const colorTools = colorKind && editors.colors ? toolRow('colors', [
                ['color', t('palette', 'Palette')],
            ], function (name) { enter(name) }) : null

            function paintColorTools() {
                if (colorTools) colorTools.color.disabled = !(current.color && current.color.isConnected)
            }

            // Logos: each tool presses a button of the editor (library, file, three wheels, remove)
            const press = logoBlock ? {
                library: $('.sx-logo-btn--library', logoBlock),
                upload: $('.sx-logo-btn--upload', logoBlock),
                position: $('.sx-adjust-btn', logoBlock),
                remove: $('.sx-remove', logoBlock),
            } : null

            const logoTools = logoKind && press && editors.logo ? toolRow('logo', [
                ['library', press.library ? press.library.textContent.trim() : 'Library'], ['upload', t('toolUpload', 'Upload')],
                ['position', t('toolPosition', 'Position')], ['remove', press.remove ? press.remove.textContent.trim() : 'Remove'],
            ], function (name) { if (press[name]) press[name].click() }) : null

            // Read from the engine, not from the editor: the chips are drawn before it is refreshed
            function paintLogoTools() {
                if (!logoTools) return

                const logo = current.logo && current.logo.isConnected ? current.logo : null
                const placed = !!logo && MmCustom.logos.isPlaced(logo)
                const shown = placed || !!(logo && MmCustom.logos.freeTransform && MmCustom.logos.freeTransform(logo))
                const noSlot = placed && !MmCustom.logos.slotBox(logo) // a logo without a slot cannot be replaced

                logoTools.library.disabled = !logo || noSlot || !press.library
                logoTools.upload.disabled = !logo || noSlot || !press.upload
                logoTools.position.disabled = !shown || !press.position
                logoTools.remove.disabled = !logo || !press.remove || !MmCustom.logos.canRemove(logo)
            }

            const ok = document.createElement('button')

            ok.type = 'button'
            ok.className = 'sx-ttool-ok'
            ok.hidden = true
            ok.innerHTML = ART.ok
            ok.setAttribute('aria-label', t('adjustOk', 'Confirm'))
            ok.addEventListener('click', function () { leave() })
            container.appendChild(ok)

            // The header goes away while a panel is open: a band takes its place at the top of the screen (.sx-band) and
            // the mat starts under it. On the left the S of Sixten; on the right the save button (the icon the header has
            // on a phone, alone) and the cart, with the short name it has in the header. No price: the band is the
            // short header. Each one presses its twin of the header: the exit guard, the account and the cart are not
            // wired a second time.
            const band = document.createElement('div')
            const twins = {
                logo: document.querySelector('.module-top-bar .sx-config-logo'),
                save: document.querySelector('.module-top-bar .save-custom'),
                cart: document.getElementById('add-to-cart'),
            }

            function bandButton(twin, className, html, label) {
                const b = document.createElement('button')

                b.type = 'button'
                b.className = className
                b.innerHTML = html
                b.title = label
                b.setAttribute('aria-label', label)
                b.addEventListener('click', function () { twin.click() })
                band.appendChild(b)

                return b
            }

            band.className = 'sx-band'

            if (twins.logo) bandButton(twins.logo, 'sx-band__logo', '<span class="sx-config-logo__s" aria-hidden="true"></span>', twins.logo.getAttribute('aria-label') || 'Sixten')

            if (twins.save) {
                // The icon alone; its name (the one of the header) in its tooltip
                const save = bandButton(twins.save, 'sx-band__save', ART.save, twins.save.textContent.trim())

                // « Save » becomes « Save changes » once the creation is saved: the tooltip follows
                new MutationObserver(function () {
                    save.title = twins.save.textContent.trim()
                    save.setAttribute('aria-label', save.title)
                }).observe(twins.save, { childList: true, characterData: true, subtree: true })
            }

            if (twins.cart) {
                bandButton(
                    twins.cart,
                    'sx-cartdock',
                    ART.cart + '<span>' + esc((twins.cart.querySelector('.sx-cart__short') || twins.cart).textContent.trim()) + '</span>',
                    (twins.cart.querySelector('.sx-cart__long') || twins.cart).textContent.trim()
                )
            }

            container.appendChild(band)

            function paintChips(kind, zones) {
                const strip = strips[kind.key]

                if (!strip) return

                let items = $$('.sx-tchip', strip.list)

                if (items.length !== zones.length) {
                    strip.list.textContent = ''
                    items = zones.map(function (zone, index) {
                        const b = document.createElement('button')

                        b.type = 'button'
                        b.className = 'sx-tchip sx-tchip--' + kind.key
                        b.setAttribute('role', 'option')

                        if (kind.key === 'colors') b.innerHTML = '<i class="sx-tchip__swatch"></i><span></span>'
                        if (kind.key === 'logo') b.innerHTML = '<span class="sx-tchip__thumb"></span>'

                        b.addEventListener('click', function () {
                            const now = zonesOf(kind)[index]

                            if (now) selectZone(now)
                        })
                        strip.list.appendChild(b)

                        return b
                    })
                }

                let chosen = null

                zones.forEach(function (zone, index) {
                    const b = items[index]
                    const on = zone.element === current[kind.type]

                    if (kind.key === 'text') {
                        const label = zone.content ? textOf(zone.element).split('\n')[0].trim() : ''

                        b.textContent = label || t('emptyText', 'Empty text')
                        b.style.fontFamily = label ? window.getComputedStyle(zone.element).fontFamily : ''
                        b.classList.toggle('is-empty', !label)
                    } else if (kind.key === 'colors') {
                        const hex = zone.color || '#000000'

                        b.firstChild.style.background = hex
                        b.firstChild.classList.toggle('is-white', hex === '#ffffff')
                        b.lastChild.textContent = zone.label
                    } else {
                        // The thumbnail of the row (a logo of the template is drawn as on the mat: turned with it)
                        const shown = paintThumb(b.firstChild, zone)
                        const name = zone.badge + ' · ' + logoInfo(zone).title

                        b.classList.toggle('is-empty', !shown)
                        b.classList.toggle('is-tpl', zone.source === 'template')

                        if (b.title !== name) {
                            b.title = name
                            b.setAttribute('aria-label', name)
                        }
                    }

                    b.classList.toggle('on', on)
                    b.classList.toggle('is-hidden', !!zone.hidden)
                    b.setAttribute('aria-selected', String(on))

                    if (on) chosen = zone
                })

                const state = chosen ? rowItem(kind, chosen).eye : ''

                if (strip.eye.dataset.state !== state) {
                    strip.eye.dataset.state = state
                    strip.eye.hidden = !state
                    strip.eye.innerHTML = state === 'off' ? ICONS.eyeOff : ICONS.eye
                    strip.eye.title = state === 'off' ? t('show', 'Show') : t('hide', 'Hide')
                    strip.eye.setAttribute('aria-label', strip.eye.title)
                    strip.eye.setAttribute('aria-pressed', String(state === 'off'))
                }

                strip.list.classList.toggle('is-turned', MmCustom.stage.state().rotation % 180 === 90)

                if (kind.key === 'text') paintTextTools()
                if (kind.key === 'colors') paintColorTools()
                if (kind.key === 'logo') paintLogoTools()

                if (mode && kind.key === modeKind && !chosenOf(kind.key)) leave() // the zone went away (undo, another design)
            }

            const showChip = function (kind) {
                const list = strips[kind.key] ? strips[kind.key].list : null
                const b = list ? list.querySelector('.sx-tchip.on') : null

                if (b) list.scrollTo({ left: Math.max(0, b.offsetLeft - (list.clientWidth - b.offsetWidth) / 2), behavior: still.matches ? 'auto' : 'smooth' })
            }

            /* zoom on the zone of the chosen text or logo */
            let zone = true // the view goes on the chosen element; false once the customer asked for the whole mat
            let zoomed = false // the view was set here: it goes back to the whole mat when the panel leaves the texts and the logos
            let gliding = 0

            // The element the view follows: the chosen text or logo, while the panel shows its kind (tools and wheels too)
            const wanted = function () {
                if (!phone.matches || !body.classList.contains('sx-dock-open') || !active) return null

                const el = active.key === 'text' ? current.text : (active.key === 'logo' ? current.logo : null)

                return el && el.isConnected ? el : null
            }

            // A move of the stage kept in range for a zoom: as the engine does (the zoomed mat fills the view), but its
            // edge may come inside the view by EDGE, so that a text or a logo of the border is not left under the buttons
            // laid on the stage. A finger on the mat or a pinch brings the engine's own range back.
            function inRange(zoom, x, y) {
                const stage = MmCustom.stage.element()
                const clip = stage ? stage.parentElement : null
                const mat = MmCustom.svg.root()

                if (!clip || !mat) return { x: x, y: y }

                const matStyle = window.getComputedStyle(mat)
                const clipStyle = window.getComputedStyle(clip)
                const turned = MmCustom.stage.state().rotation % 180 !== 0
                const w = parseFloat(matStyle.width) || stage.offsetWidth
                const h = parseFloat(matStyle.height) || stage.offsetHeight
                const vw = clip.clientWidth - parseFloat(clipStyle.paddingLeft) - parseFloat(clipStyle.paddingRight)
                const vh = clip.clientHeight - parseFloat(clipStyle.paddingTop) - parseFloat(clipStyle.paddingBottom)
                const whole = zoom <= MmCustom.stage.state().base * 1.02 // the whole mat does not move
                const limitX = whole ? 0 : Math.max(0, ((turned ? h : w) * zoom - vw) / 2) + EDGE
                const limitY = whole ? 0 : Math.max(0, ((turned ? w : h) * zoom - vh) / 2) + EDGE

                return { x: Math.max(-limitX, Math.min(limitX, x)), y: Math.max(-limitY, Math.min(limitY, y)) }
            }

            // Takes the stage to a zoom and a move, in a few frames or at once. Each frame goes through the engine
            // (zoomTo, panBy), as a pinch does: a CSS transition of the transform leaves Safari with a stale, blurred
            // picture of the mat until the next gesture.
            function glide(to, animate) {
                window.cancelAnimationFrame(gliding)

                const end = inRange(to.zoom, to.x, to.y)

                to = { zoom: to.zoom, x: end.x, y: end.y }

                const from = MmCustom.stage.state()
                const start = window.performance.now()
                const time = animate && !still.matches ? 220 : 0
                const step = function (now) {
                    const t01 = time ? Math.min(1, (now - start) / time) : 1
                    const k = 1 - Math.pow(1 - t01, 3)

                    MmCustom.stage.zoomTo(from.zoom + (to.zoom - from.zoom) * k)

                    const s = MmCustom.stage.state()

                    MmCustom.stage.panBy(from.x + (to.x - from.x) * k - s.x, from.y + (to.y - from.y) * k - s.y)

                    if (t01 < 1) gliding = window.requestAnimationFrame(step)
                }

                step(start)
            }

            /* the mat upright under the chosen text: while a text is edited, the stage is turned, a quarter turn at a time,
               so that it reads upright instead of lying on its side on a phone held upright (kept by Mathieu after his test
               on an iPhone, 14/11). It goes back as it was with the whole mat. */
            let home = null // rotation of the stage before the first turn made here: it comes back with the whole mat

            // Whole-mat zoom of the stage for a rotation, worked out as ui/zoom.js does (its own figure is not public):
            // 1 for the flat mat, what fits the view for the mat turned a quarter turn
            const baseFor = function (rotation) {
                if (rotation % 180 === 0) return 1

                const stage = MmCustom.stage.element()
                const clip = stage ? stage.parentElement : null
                const mat = MmCustom.svg.root()
                const box = MmCustom.svg.viewBox()

                if (!clip || !mat) return 0

                const matStyle = window.getComputedStyle(mat)
                const clipStyle = window.getComputedStyle(clip)
                const w = parseFloat(matStyle.width)
                const h = parseFloat(matStyle.height)
                const ratio = box ? box.width / box.height : w / h
                const drawnW = Math.min(w, h * ratio)
                const drawnH = drawnW / ratio
                const roomW = clip.clientWidth - parseFloat(clipStyle.paddingLeft) - parseFloat(clipStyle.paddingRight)
                const roomH = clip.clientHeight - parseFloat(clipStyle.paddingTop) - parseFloat(clipStyle.paddingBottom)

                return drawnW > 0 && drawnH > 0 ? Math.min(roomW / drawnH, roomH / drawnW) : 0
            }

            // Turns the stage (0, 90, 180, 270) and shows the whole mat; true when it turned
            const turnTo = function (rotation) {
                if (MmCustom.stage.state().rotation === rotation) return false

                const base = baseFor(rotation)

                if (!base) return false

                window.cancelAnimationFrame(gliding)
                MmCustom.stage.rotateTo(rotation)
                MmCustom.stage.setBase(base)

                const button = document.querySelector('.sx-toggle--rot')

                if (button) button.setAttribute('aria-pressed', String(rotation !== 0))

                return true
            }

            // The stage turned so that a text reads upright: its top edge, in the template, gives its angle. A logo keeps
            // the stage as it was (the way a logo is laid in its slot cannot be read from the engine).
            const orient = function (el) {
                if (!active) return

                let corners = null

                try {
                    if (active.key === 'text') corners = MmCustom.texts.frame(el)
                } catch (e) {
                    corners = null // not drawn
                }

                if (!corners) {
                    if (home) turnTo(home.rotation)

                    return
                }

                const angle = Math.atan2(corners[1].y - corners[0].y, corners[1].x - corners[0].x) * 180 / Math.PI

                if (!home) home = { rotation: MmCustom.stage.state().rotation, base: MmCustom.stage.state().base }

                turnTo(((Math.round(-angle / 90) * 90) % 360 + 360) % 360)
            }

            const backHome = function () {
                if (!home) return false

                const turned = turnTo(home.rotation)

                home = null

                return turned
            }

            // Zoom and move of the stage that put the element in the middle of the view with its surroundings. Worked out
            // from one measure: the stage turns and scales around its centre, moved by state.x, y.
            function focus(animate) {
                const el = wanted()
                const stage = MmCustom.stage.element()
                const clip = stage ? stage.parentElement : null

                if (!zone || !el || !clip) return

                orient(el)

                const s = MmCustom.stage.state()
                // Turned upright, the flat mat is smaller than it was on its side: the zone keeps the size it had
                const most = Math.max(s.base, home ? home.base : 0) * ZOOM_MAX
                const r = el.getBoundingClientRect()
                const v = clip.getBoundingClientRect()
                const box = stage.getBoundingClientRect()

                if (!(r.width + r.height > 0 && v.width > 0 && v.height > 0 && s.zoom > 0)) return

                const cx = box.left + box.width / 2 - s.x
                const cy = box.top + box.height / 2 - s.y
                const ux = (r.left + r.width / 2 - cx - s.x) / s.zoom
                const uy = (r.top + r.height / 2 - cy - s.y) / s.zoom
                const fit = s.zoom * Math.min(0.45 * v.width / Math.max(1, r.width), 0.35 * v.height / Math.max(1, r.height))
                const zoom = Math.min(most, Math.max(s.base, fit))

                zoomed = true
                glide({ zoom: zoom, x: v.left + v.width / 2 - cx - zoom * ux, y: v.top + v.height / 2 - cy - zoom * uy }, animate)
            }

            const unfocus = function () {
                const turned = backHome() // the whole mat, as it was before a text or a logo was edited

                if (!zoomed) return

                zoomed = false
                window.cancelAnimationFrame(gliding)

                if (!turned) MmCustom.stage.fit()
            }

            const refocus = function () {
                if (wanted()) focus(true)
                else unfocus()

                paintView()
            }

            // Under the wheels: an element that nears the edge of the zoomed view brings the view with it
            function follow(el) {
                const stage = MmCustom.stage.element()
                const clip = stage ? stage.parentElement : null

                if (!zoomed || !clip || !el || !el.isConnected) return

                const r = el.getBoundingClientRect()
                const v = clip.getBoundingClientRect()
                const mx = v.width * 0.2
                const my = v.height * 0.2
                const ex = r.left + r.width / 2
                const ey = r.top + r.height / 2
                const dx = ex < v.left + mx ? v.left + mx - ex : (ex > v.right - mx ? v.right - mx - ex : 0)
                const dy = ey < v.top + my ? v.top + my - ey : (ey > v.bottom - my ? v.bottom - my - ey : 0)

                if (dx || dy) {
                    window.cancelAnimationFrame(gliding)

                    const s = MmCustom.stage.state()
                    const to = inRange(s.zoom, s.x + dx, s.y + dy)

                    MmCustom.stage.panBy(to.x - s.x, to.y - s.y)
                }
            }

            // One button on the stage: the whole mat when the view is closer (zone or pinch), the zone of the chosen text
            // or logo when the mat is whole
            const viewButton = document.createElement('button')
            const closer = function () {
                const s = MmCustom.stage.state()

                return s.zoom > s.base * 1.02
            }

            viewButton.type = 'button'
            viewButton.className = 'sx-zoneview'
            viewButton.hidden = true
            ;($('.sx-viewport', container) || container).appendChild(viewButton)

            function paintView() {
                const state = closer() ? 'whole' : 'zone'

                viewButton.hidden = !phone.matches || (state === 'zone' && !wanted())

                if (viewButton.dataset.state === state) return

                viewButton.dataset.state = state
                viewButton.innerHTML = ART[state]
                viewButton.title = state === 'whole' ? t('viewWhole', 'Whole mat') : t('viewZone', 'Zoom on the selection')
                viewButton.setAttribute('aria-label', viewButton.title)
            }

            viewButton.addEventListener('click', function () {
                if (closer()) {
                    zone = false
                    zoomed = false

                    if (!backHome()) {
                        const s = MmCustom.stage.state()

                        glide({ zoom: s.base, x: 0, y: 0 }, true)
                    }
                } else {
                    zone = true
                    focus(true)
                }
            })

            // The zoom of the stage for the style sheet (the dashed frame keeps its size on the screen), and the button
            const onZoom = function () {
                body.style.setProperty('--sx-zoom', String(MmCustom.stage.state().zoom || 1))
                paintView()
            }

            MmCustom.on('stage:zoom', onZoom)
            onZoom()
            // The thumbnails of the template logos follow the mat
            MmCustom.on('stage:rotate', function () {
                if (strips.logo) strips.logo.list.classList.toggle('is-turned', MmCustom.stage.state().rotation % 180 === 90)
            })

            // The stage changes size (panel, tool, keyboard): the engine fits the turned mat again (ui/zoom.js, observer
            // made before this one), then the view goes back on the element. Made once the layout is mounted.
            window.requestAnimationFrame(function () {
                const stage = MmCustom.stage.element()

                if (!window.ResizeObserver || !stage || !stage.parentElement) return

                new ResizeObserver(function () {
                    if (wanted()) focus(false)
                    else unfocus()

                    paintView()
                }).observe(stage.parentElement)
            })

            /* tools that take the panel: text, font and colour of a text; palette of a colour zone */
            let mode = ''
            let modeKind = '' // key of the kind the open tool works on (text, colors)
            const viewport = window.visualViewport
            // The zone a tool works on: the chosen text, or the chosen colour zone
            const chosenOf = function (key) {
                const el = key === 'text' ? current.text : (key === 'colors' ? current.color : null)

                return el && el.isConnected ? el : null
            }
            // The wheel of a kind: its swatch opens the colour picker, its field takes the code
            const wheelOf = function (key) { return key ? document.querySelector('[data-sx-kind="' + key + '"] .mm-wheel') : null }
            const partOf = function (key, selector) {
                const wheel = wheelOf(key)

                return wheel ? wheel.querySelector(selector) : null
            }

            // Text tool: the field sits at the bottom of what the keyboard leaves of the screen, the mat above it. The
            // style sheet gets the visible height and where it starts (visualViewport: a phone that scrolls the page to
            // show the field is followed), and the height of the field (one to three lines). Before the keyboard is up
            // its height is unknown: the field waits at 55 % of the screen, clear of any keyboard, so that the phone has
            // no reason to scroll; it comes down on the keyboard as soon as the visible part has resized, or to the bottom
            // of the screen when no keyboard came (0.6 s).
            // The other tools sit at the bottom of the visible part too: the code of a colour is typed with the keyboard.
            let waiting = 0
            const measure = function (early) {
                if (!mode) return

                const full = viewport ? viewport.height : window.innerHeight

                body.style.setProperty('--sx-vvh', Math.round(early === true ? full * 0.55 : full) + 'px')
                body.style.setProperty('--sx-vvt', Math.round(viewport ? viewport.offsetTop : 0) + 'px')

                // The field of a text and the palette have the height of their content
                if (mode === 'text' || mode === 'color') body.style.setProperty('--sx-ttext-h', Math.ceil(dock.getBoundingClientRect().height) + 'px')
            }

            function enter(name) {
                const key = active ? active.key : ''

                if (mode || !phone.matches || !chosenOf(key)) return
                if ((name === 'text' || name === 'font') && (key !== 'text' || !field || (name === 'font' && !fontField))) return

                if (ui.colorPicker) ui.colorPicker.close()

                mode = name
                modeKind = key
                // Title of the bar over the grid of the fonts and over the palette (style sheet)
                dock.dataset.sxTool = name === 'font' ? t('font', 'Font') : (name === 'color' ? t('toolColor', 'Colour') : '')
                body.classList.add('sx-ttool', 'sx-ttool--' + name)
                ok.hidden = false
                measure()

                if (name === 'text') {
                    measure(true)
                    // In the tap itself: a phone only raises its keyboard for a focus asked by a gesture
                    field.focus({ preventScroll: true })

                    try { field.setSelectionRange(field.value.length, field.value.length) } catch (e) { /* not a text field */ }

                    window.clearTimeout(waiting)
                    waiting = window.setTimeout(measure, 600)
                }

                // After this tap: the list closes on any click outside itself
                if (name === 'font') {
                    window.setTimeout(function () {
                        if (mode !== 'font') return

                        fontField.open()

                        const chosen = fontField.list.querySelector('[aria-selected="true"]')

                        // The grid of the fonts scrolls down: the font of the text comes to its middle
                        if (chosen) fontField.list.scrollTop = Math.max(0, chosen.offsetTop - (fontField.list.clientHeight - chosen.offsetHeight) / 2)
                    }, 0)
                }

                window.dispatchEvent(new Event('resize'))
            }

            function leave() {
                if (!mode) return

                const was = mode
                const code = partOf(modeKind, '.mm-wheel-hex')

                mode = ''
                modeKind = ''
                body.classList.remove('sx-ttool', 'sx-ttool--' + was)
                window.clearTimeout(waiting)

                if (code && document.activeElement === code) code.blur() // the code being typed is applied
                body.style.removeProperty('--sx-ttext-h')
                body.style.removeProperty('--sx-vvh')
                body.style.removeProperty('--sx-vvt')
                ok.hidden = true

                if (ui.colorPicker) ui.colorPicker.close()
                if (was === 'text' && document.activeElement === field) field.blur()
                if (was === 'font' && fontField) fontField.close()

                window.dispatchEvent(new Event('resize'))
            }

            if (fontField) fontField.onClose = function () { if (mode === 'font') leave() }

            // Code of the custom colour, in the palette: applied as soon as it is whole (six figures), the picker gives
            // way to the keyboard, Enter puts the keyboard away
            Array.from(dock.querySelectorAll('.mm-wheel-hex')).forEach(function (code) {
                code.setAttribute('autocapitalize', 'off')
                code.addEventListener('focus', function () { if (mode === 'color' && ui.colorPicker) ui.colorPicker.close() })
                code.addEventListener('input', function () {
                    if (mode === 'color' && /^#?[0-9a-f]{6}$/i.test(code.value.trim())) code.dispatchEvent(new Event('change'))
                })
                code.addEventListener('keydown', function (event) { if (mode === 'color' && event.key === 'Enter') code.blur() })
            })

            if (field) {
                field.addEventListener('input', measure)
                // Keyboard put away (its own key, a tap elsewhere): the tool is over
                field.addEventListener('blur', function () {
                    window.setTimeout(function () { if (mode === 'text' && document.activeElement !== field) leave() }, 0)
                })
            }

            if (viewport) {
                viewport.addEventListener('resize', function () {
                    window.clearTimeout(waiting)
                    measure()
                })
                viewport.addEventListener('scroll', measure)
            }

            document.addEventListener('keydown', function (event) { if (event.key === 'Escape' && mode) leave() })

            MmCustom.on('select', function (event) {
                const detail = event.detail || {}
                const kind = kindOfType(detail.type)

                if (mode && (!kind || kind.key !== modeKind)) leave() // another kind chosen on the mat: its tool is over
                if (!kind) return

                // Once the rows are drawn and the stage has its size (the observer above has refitted it)
                twice(function () {
                    refocus()
                    showChip(kind)
                })
            })

            // A logo placed or removed: its slot is drawn again, the view goes back on it
            ;['logo:placed', 'logo:removed'].forEach(function (name) { MmCustom.on(name, function () { twice(refocus) }) })

            const off = function () {
                if (!phone.matches) {
                    leave()
                    unfocus()
                }

                paintView()
            }

            if (phone.addEventListener) phone.addEventListener('change', off)
            else if (phone.addListener) phone.addListener(off)

            phonePanel = { chips: paintChips, follow: follow }
            body.classList.add('sx-chips') // the style sheet lays the phone panels out in chips
            paintTextTools()
            paintColorTools()
            paintLogoTools()
        })()

        /* ------------------------------------------------------------- en-tête : options, sauvegarde, sortie */

        const topBar = $('.module-top-bar')
        const saveButton = $('.save-custom', topBar)
        const closeLink = $('.sx-config-close', topBar)
        const attributes = $('.module-attributes', topBar)

        // Back where the customer came from (same site, not the configurator), else the home page
        try {
            const from = document.referrer ? new URL(document.referrer) : null

            if (from && from.origin === window.location.origin && !/customModule/.test(from.pathname + from.search)) closeLink.href = from.href
        } catch (e) { /* no referrer */ }

        // Options of the product (size, design): one menu per group that offers a choice; the design opens previews
        const groups = (MmCustom.variants ? MmCustom.variants.groups() : []).filter(function (g) { return g.values.length > 1 })

        if (groups.length && attributes) {
            const box = document.createElement('div')

            box.className = 'sx-variants'
            groups.forEach(function (group) {
                const isDesign = ui.designPicker && String(ui.designPicker.groupId()) === String(group.id)
                const wrap = document.createElement(isDesign ? 'div' : 'label')
                const name = document.createElement('span')
                const select = document.createElement('select')
                const values = group.values // in the order of the attribute's values in PrestaShop (MmCustomCombination::variants)

                wrap.className = 'sx-variant'
                name.className = 'sx-variant__label'
                name.textContent = group.name
                select.className = 'sx-variant__select'
                select.setAttribute('aria-label', group.name)
                values.forEach(function (value) {
                    const option = document.createElement('option')

                    option.value = value.id
                    option.textContent = value.name.replace(/\s*[–-]\s*\d+\s*ft$/i, '')
                    option.disabled = !MmCustom.variants.isAvailable(group.id, value.id)
                    select.appendChild(option)
                })
                select.value = String(MmCustom.variants.valueOf(group.id))
                select.addEventListener('change', function () {
                    const target = MmCustom.variants.pick(group.id, select.value)

                    select.value = String(MmCustom.variants.valueOf(group.id)) // the page changes, or the customer stays on this one

                    if (target) MmCustom.variants.go(target.sku)
                })
                wrap.append(name, select)

                if (isDesign) {
                    const chosen = select.options[select.selectedIndex]
                    const button = document.createElement('button')

                    select.classList.add('sx-variant__select--picker')
                    select.tabIndex = -1
                    select.setAttribute('aria-hidden', 'true')
                    button.type = 'button'
                    button.className = 'sx-variant__select sx-design-btn'
                    button.setAttribute('aria-haspopup', 'dialog')
                    button.setAttribute('aria-label', group.name + ' : ' + (chosen ? chosen.textContent : ''))
                    button.innerHTML = '<span class="sx-design-btn__label"></span>' + ICONS.grid
                    button.querySelector('.sx-design-btn__label').textContent = chosen ? chosen.textContent : ''
                    button.addEventListener('click', function () { if (ui.designPicker.open(group.id)) dressDesigns(group) })
                    wrap.appendChild(button)
                }

                box.appendChild(wrap)
            })

            attributes.replaceChildren(box)
            attributes.classList.add('is-switcher')
        }

        // Window of the designs (ui/design-picker.js): Sixten's eyebrow (group, number of designs, size), title and note
        function dressDesigns(group) {
            const dialog = document.querySelector('.mmc-designs .mmc-designs__dialog')

            if (!dialog) return

            const title = dialog.querySelector('.mmc-designs__title')
            const grid = dialog.querySelector('.mmc-designs__grid')
            let eyebrow = dialog.querySelector('.sx-dp__eye')

            if (!eyebrow) {
                eyebrow = document.createElement('p')
                eyebrow.className = 'sx-dp__eye'
                title.before(eyebrow)

                const note = document.createElement('p')

                note.className = 'sx-dp__note'
                note.textContent = t('designNote', 'Previews in the original colours. If you have already changed the mat, you will be asked to confirm before switching.')
                grid.after(note)
                // A design without a template is taken out of the grid when its preview fails: the count follows
                new MutationObserver(function () { count() }).observe(grid, { childList: true })
            }

            const size = (String(MmCustom.config.sku || window.mm_custom_product_sku || '').match(/\d+x\d+/i) || [''])[0]
            const count = function () {
                const n = grid.children.length

                eyebrow.textContent = group.name + ' · ' + t('designsAvailable', '%d available in %s').replace('%d', n).replace('%s', size)
            }

            title.textContent = t('designTitle', 'Choose your design')
            count()
        }

        // A design in progress is not carried over to another option: ask first (Sixten wording, module's window classes)
        let switchModal = null

        MmCustom.on('variant:before-change', function (event) {
            if (!event.detail.dirty) return

            event.preventDefault()

            if (ui.designPicker) ui.designPicker.close() // the choice was made there: the question takes its place

            const sku = event.detail.to.sku

            if (!switchModal) {
                switchModal = document.createElement('div')
                switchModal.className = 'mm-modal-overlay mmc-exit sx-switch'
                switchModal.setAttribute('role', 'dialog')
                switchModal.setAttribute('aria-modal', 'true')
                switchModal.innerHTML = '<div class="mm-modal"><button type="button" class="save-auth-close" aria-label="' + esc(t('close', 'Close')) + '">&times;</button>'
                    + '<p class="mmc-exit__title">' + esc(t('switchTitle', 'Change option?')) + '</p>'
                    + '<p class="save-success-text">' + esc(t('switchText', 'Your current design will be replaced: each size and design has its own template.')) + '</p>'
                    + '<div class="save-success-actions"><button type="button" class="mm-btn sx-switch__go">' + esc(t('switchGo', 'Change and start over')) + '</button>'
                    + '<button type="button" class="mm-btn-alt sx-switch__stay">' + esc(t('keepEditing', 'Keep editing')) + '</button></div></div>'
                page.appendChild(switchModal)
                closableModal(switchModal)
                switchModal.querySelector('.sx-switch__stay').addEventListener('click', function () { closeModal(switchModal) })
            }

            switchModal.querySelector('.sx-switch__go').onclick = function () {
                closeModal(switchModal)
                MmCustom.variants.go(sku, { confirmed: true })
            }
            openModal(switchModal)
        })

        // Save, log in, register (ui/account.js); saved creations of this product (ui/existing.js)
        if (ui.account) ui.account.mount(saveButton)
        if (ui.existing) ui.existing.mount()

        // Leaving with unsaved changes (× and S of the header): confirmation (ui/exit-guard.js)
        if (ui.exitGuard) {
            ui.exitGuard.watch('.sx-config-close, .sx-config-logo', {
                onSave: function () { if (saveButton) saveButton.click() },
            })
        }

        /* ------------------------------------------------------------- scène : zoom, rotation, image, story */

        const stageBox = $('.module-container .template')
        const zoomWrap = $('.sx-zoomwrap')

        if (stageBox && ui.zoom && zoomWrap) {
            // Quarter turn: on a phone in portrait, the long mat is turned as it opens and fills the stage (autoTurn)
            const zoom = ui.zoom.mount(stageBox, { rotate: true, autoTurn: true })

            if (zoom) {
                const bar = zoom.bar
                const level = bar.querySelector('.mmc-zoom__level')
                const rotate = bar.querySelector('.mmc-zoom__rotate')
                const fit = document.createElement('button')

                bar.classList.add('sx-zoom')

                if (level) level.classList.add('sx-zoom__value')

                // ⤢ : back to the whole mat (100 %, centred)
                fit.type = 'button'
                fit.className = 'sx-zoom__fit'
                fit.textContent = '⤢'
                fit.title = t('fit', 'Fit')
                fit.setAttribute('aria-label', fit.title)
                fit.addEventListener('click', function () { if (level) level.click() })
                bar.appendChild(fit)

                if (rotate) {
                    rotate.className = 'mmc-zoom__rotate sx-toggle sx-toggle--rot'
                    rotate.innerHTML = ICONS.rotate + '<span></span>'
                    rotate.title = t('rotate', 'Turn the mat a quarter turn')
                    rotate.setAttribute('aria-label', rotate.title)
                    zoomWrap.appendChild(rotate)
                }

                zoomWrap.appendChild(bar)
            }
        }

        if (ui.tooltips) ui.tooltips.watch('.sx-stage-hint button, .sx-zoomwrap button, .sx-design-btn')
        if (ui.designHere) ui.designHere.show()

        // Image of the design, and the Instagram story
        const title = function () { const h1 = $('.module-title h1', topBar); return h1 ? h1.textContent.trim() : 'sixten' }

        function shotButton(button, label, run) {
            button.addEventListener('click', function () {
                if (button.classList.contains('is-busy')) return

                button.classList.add('is-busy')
                button.title = t('busy', 'Creating the image…')
                run().catch(function (error) {
                    console.error('mm_custom_sixten: image', error)
                    window.alert(t('failed', 'The image could not be created.'))
                }).then(function () {
                    button.classList.remove('is-busy')
                    button.title = label
                })
            })
        }

        const shot = $('.sx-shot:not(.sx-shot--story)')
        const story = $('.sx-shot--story')

        // Where an image goes. On an iPhone or an iPad a downloaded file lands in the Files app: the image is handed to the
        // share sheet instead, which offers « Save Image » (the photo library), as the 3D view does (viewer3d.js).
        // Elsewhere, and when a file cannot be shared, it is downloaded. The share sheet only opens from a gesture, and
        // the image takes a moment to be made: when the tap is too old for the phone, a bar says the image is ready and
        // its button, a fresh tap, opens the sheet.
        const IOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
        let saveBar = null

        function saveImage(blob, name) {
            const download = function () {
                const url = URL.createObjectURL(blob)
                const link = document.createElement('a')

                link.href = url
                link.download = name
                document.body.appendChild(link)
                link.click()
                link.remove()
                window.setTimeout(function () { URL.revokeObjectURL(url) }, 4000)
            }
            let file = null

            if (IOS && navigator.canShare && typeof File === 'function') {
                try { file = new File([blob], name, { type: blob.type || 'image/png' }) } catch (e) { file = null }
            }

            if (!file || !navigator.canShare({ files: [file] })) {
                download()

                return
            }

            // Closed without a choice (AbortError): nothing to do; any other refusal: the file is downloaded
            const share = function () {
                return navigator.share({ files: [file] }).catch(function (error) { if (!error || error.name !== 'AbortError') download() })
            }

            navigator.share({ files: [file] }).catch(function (error) {
                if (error && error.name === 'AbortError') return

                if (!error || error.name !== 'NotAllowedError') {
                    download()

                    return
                }

                if (saveBar) saveBar.remove()

                saveBar = document.createElement('div')
                saveBar.className = 'sx-saveimg'
                saveBar.setAttribute('role', 'status')
                saveBar.innerHTML = '<span>' + esc(t('imageReady', 'Your image is ready')) + '</span>'
                    + '<button type="button" class="sx-saveimg__go">' + esc(t('saveImage', 'Save the image')) + '</button>'
                    + '<button type="button" class="sx-saveimg__close" aria-label="' + esc(t('adjustBack', 'Cancel')) + '">&times;</button>'

                const bar = saveBar
                const close = function () { bar.remove(); if (saveBar === bar) saveBar = null }

                bar.querySelector('.sx-saveimg__go').addEventListener('click', function () { close(); share() })
                bar.querySelector('.sx-saveimg__close').addEventListener('click', close)
                document.body.appendChild(bar)
                window.setTimeout(close, 20000)
            })
        }

        if (MmCustom.export) {
            shotButton(shot, shot.title, function () {
                if (!IOS) return MmCustom.export.download({ title: title() })

                return MmCustom.export.png({ title: title() }).then(function (blob) {
                    const name = MmCustom.export.fileName(title())

                    saveImage(blob, name)
                    MmCustom.emit('exported', { fileName: name })
                })
            })
            shotButton(story, story.title, function () {
                return buildStory().then(function (blob) {
                    saveImage(blob, MmCustom.export.fileName(title()).replace(/\.png$/, '') + '-story.png')
                })
            })
        } else {
            shot.hidden = true
            story.hidden = true
        }

        /*
         * Vue 3D (Mathieu, 2026-11-12) : bouton « 3D » après la story. Au premier clic seulement, views/js/viewer3d.js et three.js
         * (jsDelivr, version figée) sont chargés ; la texture est l'image du tapis telle qu'elle est (MmCustom.export.canvas).
         * Proposé pour un tapis dont la taille est connue (MmCustom.product.sizeCm, 4 m au plus) et si le navigateur a WebGL.
         */
        const VIEWER_URL = window.mm_custom_sixten && window.mm_custom_sixten.viewer3d
        const matSize = MmCustom.product && MmCustom.product.sizeCm ? MmCustom.product.sizeCm() : null

        if (MmCustom.export && VIEWER_URL && matSize && matSize.length && matSize.width && matSize.length <= 400 && story) {
            const view3d = document.createElement('button')

            view3d.type = 'button'
            view3d.className = 'sx-shot sx-shot--3d'
            view3d.innerHTML = '<span aria-hidden="true">3D</span>'
            view3d.title = t('view3d', 'See the mat in 3D')
            view3d.setAttribute('aria-label', view3d.title)
            // With the view controls (rotation, zoom), at their head: on a phone as on a computer
            if (zoomWrap) zoomWrap.insertBefore(view3d, zoomWrap.firstChild)
            else story.insertAdjacentElement('afterend', view3d)

            let viewerModule = null

            // The print, at most 3000 px wide, in JPEG (under the server's 6 MB), sent with what the phone page shows
            const shareArt = function (art, box, size, design) {
                const width = Math.min(3000, art.width)
                const canvas = document.createElement('canvas')

                canvas.width = width
                canvas.height = Math.round(art.height * width / art.width)
                canvas.getContext('2d').drawImage(art, 0, 0, canvas.width, canvas.height)

                let image = canvas.toDataURL('image/jpeg', 0.9)

                if (image.length > 7800000) image = canvas.toDataURL('image/jpeg', 0.75)

                return MmCustom.ajax(window.mm_custom_sixten.ar, {
                    action: 'share',
                    token: MmCustom.config.token,
                    image: image,
                    length: size.length,
                    width: size.width,
                    title: title(),
                    subtitle: [size.width + ' × ' + size.length + ' cm', design ? design.textContent.trim() : ''].filter(Boolean).join(' · '),
                    inkBlur: box && box.width ? 2 * width / box.width : 1.2,
                }, { json: true }).then(function (res) {
                    if (!res || !res.url) throw new Error('share')

                    return res.url
                })
            }

            view3d.addEventListener('click', function () {
                if (view3d.classList.contains('is-busy')) return

                view3d.classList.add('is-busy')
                view3d.title = t('view3dLoading', 'Preparing the 3D view…')

                const load = viewerModule ? Promise.resolve(viewerModule) : import(VIEWER_URL).then(function (m) { viewerModule = m; return m })
                const box = MmCustom.svg.viewBox()

                // l'impression sans le feutre : la vue 3D pose elle-même le feutre répété à l'échelle réelle (comme la démo)
                Promise.all([load, MmCustom.export.canvas({ width: 4096, texture: false })]).then(function (results) {
                    const viewer = results[0]

                    if (!viewer.supported()) throw new Error('webgl')

                    view3d.classList.remove('is-busy')
                    view3d.title = t('view3d', 'See the mat in 3D')

                    const design = $('.sx-design-btn span', topBar)

                    return viewer.open({
                        art: results[1],
                        felt: window.mm_custom_sixten.img + 'felt.webp',
                        // flou d'encre de la démo : 2 unités du gabarit, ramenées en pixels de l'image
                        inkBlur: box && box.width ? 2 * results[1].width / box.width : 1.2,
                        sizeCm: matSize,
                        title: title(),
                        subtitle: [matSize.width + ' × ' + matSize.length + ' cm', design ? design.textContent.trim() : ''].filter(Boolean).join(' · '),
                        fileName: MmCustom.export.fileName(title()).replace(/\.png$/, ''),
                        t: t,
                        // « Voir chez moi » from a computer: the print goes to the server (48 h) for the phone (QR code)
                        share: window.mm_custom_sixten.ar ? function () { return shareArt(results[1], box, matSize, design) } : null,
                    })
                }).catch(function (error) {
                    console.error('mm_custom_sixten: 3D', error)
                    window.alert(t('view3dFailed', 'The 3D view is not available on this device.'))
                }).then(function () {
                    view3d.classList.remove('is-busy')
                    view3d.title = t('view3d', 'See the mat in 3D')
                    view3d.focus({ preventScroll: true })
                })
            })
        }

        /*
         * Story Instagram (Sixten 0.18.25) : 1080 × 1920. Fond noir, dégradé radial centré ; grand S de la marque en contour
         * très fin derrière le tapis ; le tapis entier, debout, centré dans une zone de 920 × 1204 px à partir de y = 285 ;
         * dessous le logo Sixten et « Motorsport Customization ». Les 250 px du haut et du bas restent libres (barre de la
         * story et zone de réponse d'Instagram).
         */
        const S_PATH = 'M0,-23.704L-49.704,-60.109C-52.912,-62.132 -55.3,-66.169 -52.835,-72.208L-50.371,-78.248C-47.906,-84.288 -42.232,-88.304 -34.171,-88.283L-26.109,-88.262C-18.048,-88.241 -15.659,-84.204 -18.946,-76.151L-22.233,-68.098C-25.518,-60.046 -23.132,-56.008 -15.07,-55.987L37.331,-55.851C45.392,-55.83 51.065,-59.847 54.35,-67.899L69.139,-104.136C83.929,-140.374 74.378,-156.996 38.102,-157.091L-144.468,-157.091L-113.897,-110.116L-113.884,-110.121C-114.701,-108.338 -115.5,-106.512 -116.273,-104.619L-134.348,-60.33C-148.316,-26.105 -142.019,-16.818 -118.69,0.171L-68.987,36.576C-65.776,38.599 -63.391,42.637 -65.854,48.676L-68.32,54.715C-70.785,60.756 -76.457,64.771 -84.518,64.75L-102.658,64.703C-110.719,64.682 -113.108,60.645 -109.821,52.593L-104.892,40.513C-101.605,32.461 -103.992,28.424 -112.053,28.403L-164.454,28.266C-172.515,28.246 -178.187,32.261 -181.474,40.314L-197.906,80.578C-212.696,116.815 -203.145,133.198 -166.869,133.292L-76.176,133.292C-39.9,133.387 -17.205,117.324 -2.416,81.087L15.659,36.797C29.627,2.573 23.33,-6.714 0,-23.704'

        function loadImage(src) {
            return new Promise(function (resolve, reject) {
                const image = new Image()

                image.onload = function () { resolve(image) }
                image.onerror = reject
                image.src = src
            })
        }

        function brandLogo() {
            // Sixten logo of the module (img/sixten-logo.svg of the theme), sized: its file says width="100%"
            return fetch((SX.img || '') + 'sixten-logo.svg').then(function (res) { return res.ok ? res.text() : Promise.reject(new Error(res.status)) }).then(function (text) {
                const sized = text.replace(/(<svg[^>]*?)\swidth="100%"/, '$1 width="1480"').replace(/(<svg[^>]*?)\sheight="100%"/, '$1 height="416"')
                const url = URL.createObjectURL(new Blob([sized], { type: 'image/svg+xml' }))

                return loadImage(url).then(function (image) { URL.revokeObjectURL(url); return image })
            }).catch(function () { return null })
        }

        function spacedWidth(ctx, text, spacing) {
            return Array.from(text).reduce(function (sum, c) { return sum + ctx.measureText(c).width + spacing }, 0) - spacing
        }

        function spacedText(ctx, text, x, y, spacing) {
            let cx = x

            Array.from(text).forEach(function (c) { ctx.fillText(c, cx, y); cx += ctx.measureText(c).width + spacing })
        }

        function buildStory() {
            const W = 1080
            const H = 1920
            const fontsReady = document.fonts && document.fonts.load
                ? Promise.all([document.fonts.load('900 56px Montserrat'), document.fonts.load('500 14px Montserrat')]).catch(function () {})
                : Promise.resolve()

            return Promise.all([MmCustom.export.canvas({ width: 3000 }), brandLogo(), fontsReady]).then(function (results) {
                const mat = results[0]
                const logo = results[1]
                const canvas = document.createElement('canvas')
                const ctx = canvas.getContext('2d')

                canvas.width = W
                canvas.height = H

                // Black background, radial gradient (ellipse of 540 × 960 px): #303030 in the centre, #212121 at 42 %, black at the edge
                ctx.fillStyle = '#000'
                ctx.fillRect(0, 0, W, H)
                ctx.save()
                ctx.translate(W / 2, H / 2)
                ctx.scale(W / 2, H / 2)

                const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 1)

                gradient.addColorStop(0, '#303030')
                gradient.addColorStop(0.42, '#212121')
                gradient.addColorStop(1, '#000')
                ctx.fillStyle = gradient
                ctx.fillRect(-1, -1, 2, 2)
                ctx.restore()

                // Big outlined S of the brand behind the mat (2 px at this scale), larger than the image
                ctx.save()
                ctx.translate(889.128308, 1071.51568)
                ctx.scale(5.33777, 5.33777)
                ctx.lineWidth = 0.37
                ctx.lineJoin = 'round'
                ctx.strokeStyle = '#262626'
                ctx.stroke(new Path2D(S_PATH))
                ctx.restore()

                // The whole mat, standing (wide mats are turned), centred, as large as possible in 920 × 1204 px
                const bx = 80
                const by = 285
                const bw = 920
                const bh = 1204
                const turn = mat.width > mat.height
                const iw = turn ? mat.height : mat.width
                const ih = turn ? mat.width : mat.height
                const k = Math.min(bw / iw, bh / ih)
                const dw = Math.round(iw * k)
                const dh = Math.round(ih * k)

                ctx.save()
                ctx.translate(Math.round(bx + (bw - dw) / 2) + dw / 2, Math.round(by + (bh - dh) / 2) + dh / 2)

                if (turn) {
                    ctx.rotate(-Math.PI / 2)
                    ctx.drawImage(mat, -dh / 2, -dw / 2, dh, dw)
                } else {
                    ctx.drawImage(mat, -dw / 2, -dh / 2, dw, dh)
                }

                ctx.restore()

                // Sixten logo under the mat (200 px wide), then « Motorsport Customization », small, in white
                if (logo) {
                    ctx.drawImage(logo, (W - 200) / 2, 1544, 200, 200 * 416 / 1480)
                } else {
                    ctx.fillStyle = '#fff'
                    ctx.textAlign = 'center'
                    ctx.font = '900 44px Montserrat, Arial, sans-serif'
                    ctx.fillText('SIXTEN', W / 2, 1590)
                }

                const eyebrow = t('storyEyebrow', 'Motorsport Customization').toUpperCase()

                ctx.textAlign = 'left'
                ctx.textBaseline = 'alphabetic'
                ctx.fillStyle = '#fff'
                ctx.font = '500 14px Montserrat, Arial, sans-serif'

                const spacing = (286 - spacedWidth(ctx, eyebrow, 0)) / Math.max(1, eyebrow.length - 1) // 286 px wide, as on the model

                spacedText(ctx, eyebrow, Math.round((W - 286) / 2), 1634, spacing)

                return new Promise(function (resolve, reject) {
                    canvas.toBlob(function (blob) { blob ? resolve(blob) : reject(new Error('toBlob')) }, 'image/png')
                })
            })
        }

        /* ------------------------------------------------------------- panier */

        const addToCart = document.getElementById('add-to-cart')

        // Sent by AJAX: a lost security token is renewed and the request sent again; on failure the design stays on screen
        addToCart.addEventListener('click', function (event) {
            event.preventDefault()

            if (addToCart.disabled) return

            addToCart.disabled = true
            Promise.resolve().then(function () { return MmCustom.cart.add() }).catch(function (error) {
                console.error('mm_custom_sixten: add to cart', error)

                return { success: false, error: 'failed' }
            }).then(function (res) {
                if (res.success) {
                    // Short delay: the listeners of PrestaShop's updateCart event (Meta pixel…) send their beacon first
                    window.setTimeout(function () { window.location.assign(res.cart_url) }, 400)
                } else {
                    addToCart.disabled = false

                    if (res.error === 'cart_refused' && res.errors && res.errors.length) {
                        window.alert(res.errors.join('\n'))
                    } else if (res.error !== 'cancelled') {
                        window.alert(MmCustom.t('addToCartFailed', 'Your design could not be added to the cart. Please try again.'))
                    }
                }
            })
        })

        window.addEventListener('pageshow', function (event) { if (event.persisted) addToCart.disabled = false })

        setActive(null)
    }
})(window, document)
