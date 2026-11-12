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

        // Logos: dragged anywhere on the mat (as on new.sixten), size handles and free rotation
        if (MmCustom.drag) MmCustom.drag.configure({ logoZone: 'template', handles: true, rotation: true })
        // Ink of the print on the felt, flat 2 cm sole
        if (MmCustom.effects) MmCustom.effects.configure({ ink: true, sole: { cm: 2, fill: '#333333' } })

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

            if (detail.type === 'color') syncColor()
            if (detail.type === 'text') syncText()
            if (detail.type === 'logo') syncLogo()
        })

        /* ------------------------------------------------------------- lignes */

        const rows = {}
        const editors = {}
        const collapsed = {} // kind key -> the editor of the chosen row is folded (arrow of the row)
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
                syncHides()
            })
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
            resetButton.addEventListener('click', function () { MmCustom.history.reset() }) // can be undone
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

        // Colours of the template, after the default swatches, in the colour tool and in the text colour tool
        const templateColors = MmCustom.colors.templateColors()

        $$('.colors-section-trends .colors-grid').forEach(function (grid) {
            const swatchClass = grid.querySelector('.font-color') ? 'font-color' : 'colors-color'

            grid.querySelectorAll('button').forEach(function (b) { if (hexOf(b.style.backgroundColor) === '#ffffff') b.classList.add('white') })
            templateColors.forEach(function (hex) {
                const swatch = document.createElement('button')

                swatch.type = 'button'
                swatch.className = swatchClass + ' sx-tpl-color'
                swatch.style.backgroundColor = hex
                swatch.title = hex.toUpperCase()
                swatch.setAttribute('aria-label', swatch.title)
                grid.appendChild(swatch)
            })
        })

        // Printing note under the swatches of the colour tool
        const trends = $('.colors-section-trends', colorBlock)

        if (trends) {
            const note = document.createElement('p')

            note.className = 'sx-note'
            note.textContent = t('printNote', 'Custom printed colors may vary slightly from those shown on screen, depending on your display and the printing process.')
            trends.appendChild(note)
        }

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

        /* ------------------------------------------------------------- textes */

        const textArea = textBlock ? $('.inputTextDesign', textBlock) : null
        let fontMenu = null

        // The switch of the logo editor follows what the eye of its row did (a text has no switch: the eye of its row is enough)
        function syncHides() {
            const hideLogo = logoBlock ? $('#sx-hide-logo', logoBlock) : null
            const zone = hideLogo && current.logo ? MmCustom.zones.of(current.logo) : null

            if (zone) hideLogo.checked = !!zone.hidden
        }

        function syncText() {
            if (!current.text) return

            MmCustom.texts.select(current.text, { silent: true }) // reads its matrix again (the text editor writes through it)

            markPicked(textBlock, [window.getComputedStyle(current.text).fill])

            if (wheels.text) wheels.text.sync()
            if (fontMenu) fontMenu.sync()

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

        // Field (several lines when the text allows it), alignment, size: ui/text-editor.js of mm_custom, in the Sixten bar
        let editor = null

        if (textArea && ui.textEditor) {
            editor = ui.textEditor.mount(textArea, { text: true, align: true, size: true, fonts: [] })
        }

        if (editor) {
            const root = editor.root
            const bar = root.querySelector('.mmc-text-editor__bar')
            const align = root.querySelector('.mmc-text-editor__align')
            const size = root.querySelector('.mmc-text-editor__size')
            const field = root.querySelector('textarea')

            textArea.insertBefore(root, textArea.querySelector('.sx-text-foot'))
            bar.classList.add('sx-text-bar')

            if (field) {
                field.classList.remove('form-control')
                field.placeholder = t('yourText', 'Your text')
                field.addEventListener('input', fitTextField)
            }

            if (align) {
                align.className = 'sx-text-bar__align'
                align.querySelectorAll('button').forEach(function (b) {
                    b.className = ''
                    b.innerHTML = ICONS[b.dataset.align] || b.textContent
                })
            }

            if (size) {
                size.className = 'sx-size'
                size.querySelectorAll('button, input').forEach(function (el) { el.className = '' })
                size.title = MmCustom.t('textSize', 'Text size')
            }

            // Font menu with a preview: each font written in itself, with the text of the selected zone
            let fonts = []

            try { fonts = JSON.parse(textArea.dataset.mmcFonts || '[]') } catch (e) { fonts = [] }

            if (fonts.length) fontMenu = mountFontMenu(bar, size, fonts)
        }

        function fitTextField() {
            const field = textArea && textArea.querySelector('.mmc-text-editor textarea')

            if (!field || !current.text) return

            const max = MmCustom.texts.maxLines(current.text)
            const lines = Math.min(max, Math.max(1, field.value.split('\n').length))

            field.rows = lines
            body.classList.toggle('sx-text-multi', lines > 1 || !!MmCustom.texts.slotOf(current.text))
        }

        function mountFontMenu(bar, before, fonts) {
            const menu = document.createElement('div')
            const list = document.createElement('ul')

            menu.className = 'sx-fontmenu'
            menu.innerHTML = '<button type="button" class="sx-fontmenu__btn" aria-haspopup="listbox" aria-expanded="false"><span></span></button>'
            list.className = 'sx-fontlist'
            list.setAttribute('role', 'listbox')
            list.hidden = true

            const button = menu.querySelector('button')
            const preview = button.querySelector('span')

            button.title = t('font', 'Font')
            button.setAttribute('aria-label', button.title)

            fonts.forEach(function (font) {
                const item = document.createElement('li')

                item.setAttribute('role', 'option')
                item.tabIndex = -1
                item.dataset.font = font
                item.style.fontFamily = '"' + font + '"'
                item.title = prettyFamily(font)
                list.appendChild(item)
            })

            bar.insertBefore(menu, before)
            page.appendChild(list) // a fixed layer: the tools column clips its content

            const sample = function () {
                return (textOf(current.text) || 'Aa Bb 123').slice(0, 40)
            }

            const close = function (focusButton) {
                if (list.hidden) return

                list.hidden = true
                button.setAttribute('aria-expanded', 'false')

                if (focusButton === true) button.focus()
            }
            const open = function () {
                const rect = button.getBoundingClientRect()
                const width = Math.max(rect.width, 300)

                list.hidden = false
                button.setAttribute('aria-expanded', 'true')
                list.style.cssText = 'left:' + Math.min(rect.left, window.innerWidth - width - 8) + 'px;bottom:' + (window.innerHeight - rect.top + 6)
                    + 'px;width:' + width + 'px;max-height:' + Math.min(Math.max(160, rect.top - 16), 360) + 'px'

                const selected = list.querySelector('[aria-selected="true"]') || list.firstElementChild

                if (selected) {
                    selected.scrollIntoView({ block: 'nearest' })
                    selected.focus({ preventScroll: true })
                }
            }

            const sync = function () {
                const family = current.text ? familyOf(window.getComputedStyle(current.text).fontFamily) : ''
                const text = sample()

                preview.textContent = text
                preview.style.fontFamily = family ? '"' + family + '"' : ''
                button.title = family ? prettyFamily(family) : t('font', 'Font')
                list.querySelectorAll('li').forEach(function (item) {
                    item.textContent = text
                    item.setAttribute('aria-selected', String(item.dataset.font.toLowerCase() === family.toLowerCase()))
                })
            }

            button.addEventListener('click', function (event) {
                event.stopPropagation()

                if (list.hidden) open()
                else close()
            })

            button.addEventListener('keydown', function (event) {
                if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); open() }
            })

            list.addEventListener('keydown', function (event) {
                const items = Array.from(list.children)
                const at = items.indexOf(document.activeElement)
                let next = null

                if (event.key === 'ArrowDown') next = items[Math.min(items.length - 1, at + 1)]
                else if (event.key === 'ArrowUp') next = items[Math.max(0, at - 1)]
                else if (event.key === 'Home') next = items[0]
                else if (event.key === 'End') next = items[items.length - 1]
                else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); if (items[at]) choose(items[at]); return }
                else if (event.key === 'Escape') { event.preventDefault(); close(true); return }
                else if (event.key === 'Tab') { close(); return }

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
                close(true)
                sync()

                // The new glyphs change the line spacing and the slot fit: measure again once the font is loaded
                const refit = function () { if (element.querySelector('tspan')) MmCustom.texts.setLines(element, MmCustom.texts.lines(element)) }

                if (document.fonts && document.fonts.load) {
                    Promise.race([document.fonts.load('100px "' + font + '"', 'Hg'), new Promise(function (r) { setTimeout(r, 2500) })]).then(refit, refit)
                }
            }

            document.addEventListener('click', function (event) { if (!list.hidden && !list.contains(event.target)) close() })
            document.addEventListener('keydown', function (event) { if (event.key === 'Escape') close() })
            window.addEventListener('resize', close)
            MmCustom.on('text:change', function (event) { if (event.detail.element === current.text) sync() })

            return { sync: sync }
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
            const offset = $('.sx-logo-pos input', logoBlock)
            const offsetValue = $('.sx-logo-pos__val', logoBlock)
            const hideLogo = $('#sx-hide-logo', logoBlock)
            const tooBig = $('.sx-logo-hint', logoBlock)
            const drop = $('.sx-drop', logoBlock)
            const dropTitle = drop ? drop.querySelector('strong') : null
            const emptyThumb = thumb.innerHTML
            const emptyName = metaName.textContent
            const emptyFrom = metaFrom.textContent
            let pending = null // name and origin of the logo being placed

            // Length of the mat in cm, from the SKU (SIXCUST-HON-95X200-CLASSIC = 95 x 200 cm): the offset is shown in cm
            const size = MmCustom.product && MmCustom.product.sizeCm ? MmCustom.product.sizeCm() : null
            const lengthCm = size ? size.length : 0

            // Logo drawn in the template (not placed by the customer): its size and its offset are its free transform
            const freeOf = function (logo) { return logo && MmCustom.logos.freeTransform ? MmCustom.logos.freeTransform(logo) : null }
            const sizeOfFree = function (free) { return Math.round((free.s - 1) * 100) }
            const widen = function (value) {
                if (value > parseFloat(sizeSlider.max)) sizeSlider.max = String(value)
                if (value < parseFloat(sizeSlider.min)) sizeSlider.min = String(value)
            }

            // Offset along the mat: centre of the logo minus centre of its slot, in template units
            const offsetOf = function (logo) {
                const free = freeOf(logo)

                if (free) return Math.round(free.tx)

                const slot = MmCustom.logos.slotBox(logo)

                if (!slot) return 0

                const box = MmCustom.geometry.boundsOf(MmCustom.logos.frame(logo))

                return Math.round((box.x + box.width / 2) - (slot.x + slot.width / 2))
            }
            const formatOffset = function (dx) {
                const box = MmCustom.svg.viewBox()

                if (!dx) return '0'

                const sign = dx > 0 ? '+' : '−'

                return lengthCm && box ? sign + ' ' + Math.round(Math.abs(dx) * lengthCm / Math.max(box.width, box.height)) + ' cm' : sign + ' ' + Math.abs(dx)
            }

            refreshLogoEditor = function () {
                const logo = current.logo
                const placed = !!logo && MmCustom.logos.isPlaced(logo)
                const shown = placed || !!freeOf(logo) // a logo of the template has its size and its offset too
                const zone = logo ? MmCustom.zones.all('logo').find(function (z) { return z.element === logo }) : null

                if (dropTitle) dropTitle.textContent = shown ? t('dropNew', 'Drop a new logo') : t('dropLogo', 'Drop your logo here')

                thumb.classList.toggle('sx-thumb--empty', !shown)
                sizeBox.classList.toggle('hide', !shown)
                offset.disabled = !shown
                removeButton.hidden = !MmCustom.logos.canRemove(logo)
                tooBig.hidden = !(placed && MmCustom.logos.overflows(logo))

                // A logo of a creation reopened from 2.x has no known slot: it cannot be replaced here (it can be removed
                // from the mat, resized, moved), so the library and the drop zone are not offered for it
                const noSlot = placed && !MmCustom.logos.slotBox(logo)

                $$('.sx-logo--library, .sx-logo--import', logoBlock).forEach(function (box) { box.hidden = noSlot })

                if (!shown || !zone) {
                    thumb.dataset.thumb = ''
                    thumb.innerHTML = emptyThumb
                    metaName.textContent = emptyName
                    metaFrom.textContent = emptyFrom
                    offset.value = '0'
                    offsetValue.textContent = '0'

                    return
                }

                paintThumb(thumb, zone)

                const info = logoInfo(zone)

                metaName.textContent = info.title
                metaFrom.textContent = info.meta

                if (document.activeElement !== offset) {
                    const dx = offsetOf(logo)

                    offset.value = String(dx)
                    offsetValue.textContent = formatOffset(dx)
                }
            }

            syncLogo = function () {
                const logo = current.logo

                const free = freeOf(logo)

                if (free || MmCustom.logos.isPlaced(logo)) {
                    const value = free ? sizeOfFree(free) : MmCustom.logos.sizeOf(logo)

                    widen(value)
                    sizeSlider.value = value
                }

                const zone = logo ? MmCustom.zones.of(logo) : null

                hideLogo.checked = !!zone && !!zone.hidden
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
            })

            // The handles scale a logo of the template: the slider follows
            MmCustom.on('logo:scaled', function (event) {
                const free = event.detail.element === current.logo ? freeOf(current.logo) : null

                if (!free || document.activeElement === sizeSlider) return

                widen(sizeOfFree(free))
                sizeSlider.value = sizeOfFree(free)
            })

            sizeSlider.addEventListener('input', function () {
                const free = freeOf(current.logo)

                // Logo of the template: the slider value is its scale (0 = as drawn, 100 = twice as big)
                if (free) MmCustom.logos.scaleBy(current.logo, Math.max(0.05, 1 + parseFloat(sizeSlider.value) / 100) / free.s)
                else if (current.logo) MmCustom.logos.resize(current.logo, sizeSlider.value)
            })

            offset.addEventListener('input', function () {
                const logo = current.logo

                if (!MmCustom.logos.isPlaced(logo) && !freeOf(logo)) return

                const dx = parseFloat(offset.value) || 0

                MmCustom.logos.moveBy(logo, dx - offsetOf(logo), 0)
                offsetValue.textContent = formatOffset(dx)
            })
            offset.addEventListener('change', refreshLogoEditor)

            hideLogo.addEventListener('change', function () {
                if (current.logo) MmCustom.logos.setVisible(current.logo, !hideLogo.checked)
            })

            removeButton.addEventListener('click', function () {
                const fresh = MmCustom.logos.remove(current.logo)

                if (fresh) MmCustom.zones.select(MmCustom.zones.of(fresh))
            })

            tooBig.addEventListener('click', function () {
                if (current.logo) MmCustom.drag.fitToSlot(current.logo) // the slider follows (logo:resized)
            })

            const notPlaced = function (error) {
                pending = null
                console.error('mm_custom_sixten: logo not placed', error)
                window.alert(t('logoNotPlaced', 'The logo could not be placed. Choose a logo slot on the mat, then try again.'))
            }

            // Library: the button opens the module's window; a logo placed from it in the current slot
            $('.sx-lib-btn', logoBlock).addEventListener('click', function () { openModal(libraryModal) })

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
            const zoom = ui.zoom.mount(stageBox, { rotate: true })

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

        if (MmCustom.export) {
            shotButton(shot, shot.title, function () { return MmCustom.export.download({ title: title() }) })
            shotButton(story, story.title, function () {
                return buildStory().then(function (blob) {
                    const url = URL.createObjectURL(blob)
                    const link = document.createElement('a')

                    link.href = url
                    link.download = MmCustom.export.fileName(title()).replace(/\.png$/, '') + '-story.png'
                    document.body.appendChild(link)
                    link.click()
                    link.remove()
                    window.setTimeout(function () { URL.revokeObjectURL(url) }, 4000)
                })
            })
        } else {
            shot.hidden = true
            story.hidden = true
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
