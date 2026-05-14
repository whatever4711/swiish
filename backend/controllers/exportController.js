const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const QRCode = require('qrcode');
const { Readable } = require('stream');
const latex = require('node-latex');
const Card = require('../models/Card');
const { escapeLatex } = require('../utils/sanitize');

exports.exportPdf = async (req, res, next) => {
    try {
        const shortCode = req.params.shortCode;
        const format = req.query.format || 'pdf';
        const layout = req.query.layout || 'single';
        if (!shortCode || shortCode.length !== 7 || !/^[a-zA-Z0-9]{7}$/.test(shortCode)) {
            return res.status(400).json({ error: 'Invalid short code' });
        }
        const card = await Card.findByShortCode(shortCode);
        if (!card) return res.status(404).json({ error: 'Card not found' });
        const cardData = JSON.parse(card.data);
        const pdfData = {
            firstName: cardData.personal?.firstName || '',
            middleName: cardData.personal?.middleName || '',
            lastName: cardData.personal?.lastName || '',
            prefix: cardData.personal?.prefix || '',
            suffix: cardData.personal?.suffix || '',
            title: cardData.personal?.title || '',
            company: cardData.personal?.company || '',
            email: cardData.contact?.email || '',
            phone: cardData.contact?.phone || '',
            website: cardData.contact?.website || '',
            bio: cardData.personal?.bio || ''
        };

        if (format === 'tex') {
            const fullName = [pdfData.prefix, pdfData.firstName, pdfData.middleName, pdfData.lastName, pdfData.suffix].filter(Boolean).join(' ').trim();
            let content = await fs.readFile(path.join(__dirname, '..', 'latex_templates', 'card_content.tex'), 'utf8');
            const replacements = {
                '{{fullName}}': escapeLatex(fullName),
                '{{title}}': escapeLatex(pdfData.title),
                '{{email}}': escapeLatex(pdfData.email),
                '{{phone}}': escapeLatex(pdfData.phone),
                '{{website}}': escapeLatex(pdfData.website),
                '{{company}}': escapeLatex(pdfData.company)
            };
            for (const [k,v] of Object.entries(replacements)) content = content.split(k).join(v);
            let mainTex = await fs.readFile(path.join(__dirname, '..', 'latex_templates', 'business_card_template.tex'), 'utf8');
            mainTex = mainTex.replace(/\\input\{card_content\.tex\}/, content);
            res.setHeader('Content-Type', 'text/plain');
            res.setHeader('Content-Disposition', `attachment; filename="card_${shortCode}.tex"`);
            return res.send(mainTex);
        }

        // PDF generation
        const vcardString = buildVCardString(pdfData);
        const tempDir = os.tmpdir();
        const uniqueId = `${shortCode}_${Date.now()}`;
        const qrTempPath = path.join(tempDir, `qr_${uniqueId}.png`);
        await QRCode.toFile(qrTempPath, vcardString, { width: 200, margin: 1 });
        const buildDir = path.join(tempDir, `latex_build_${uniqueId}`);
        await fs.mkdir(buildDir, { recursive: true });
        await fs.copyFile(qrTempPath, path.join(buildDir, 'qr_image.png'));
        let cardContent = await fs.readFile(path.join(__dirname, '..', 'latex_templates', 'card_content.tex'), 'utf8');
        const fullName = [pdfData.prefix, pdfData.firstName, pdfData.middleName, pdfData.lastName, pdfData.suffix].filter(Boolean).join(' ').trim();
        const replacements = {
            '{{fullName}}': escapeLatex(fullName),
            '{{title}}': escapeLatex(pdfData.title),
            '{{email}}': escapeLatex(pdfData.email),
            '{{phone}}': escapeLatex(pdfData.phone),
            '{{website}}': escapeLatex(pdfData.website),
            '{{company}}': escapeLatex(pdfData.company)
        };
        for (const [k,v] of Object.entries(replacements)) cardContent = cardContent.split(k).join(v);
        cardContent = cardContent.replace(/{{qrImage}}/g, 'qr_image.png');
        await fs.writeFile(path.join(buildDir, 'card_content.tex'), cardContent);
        const mainTemplate = layout === 'a4' ? 'business_card_sheet.tex' : 'business_card_template.tex';
        let mainTex = await fs.readFile(path.join(__dirname, '..', 'latex_templates', mainTemplate), 'utf8');
        await fs.writeFile(path.join(buildDir, 'main.tex'), mainTex);
        const inputStream = Readable.from([mainTex]);
        const pdfStream = latex(inputStream, { cwd: buildDir, inputs: [buildDir] });
        const chunks = [];
        await new Promise((resolve, reject) => {
            pdfStream.on('data', c => chunks.push(c));
            pdfStream.on('end', resolve);
            pdfStream.on('error', reject);
        });
        const pdfBuffer = Buffer.concat(chunks);
        await fs.rm(buildDir, { recursive: true, force: true });
        await fs.unlink(qrTempPath).catch(()=>{});
        const outputFileName = layout === 'a4' ? `cards_${shortCode}_a4.pdf` : `card_${shortCode}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${outputFileName}"`);
        res.send(pdfBuffer);
    } catch (err) { next(err); }
};