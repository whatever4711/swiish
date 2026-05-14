function buildVCardString(cardData) {
    const {
        firstName = '',
        middleName = '',
        lastName = '',
        prefix = '',
        suffix = '',
        title = '',
        company = '',
        email = '',
        phone = '',
        website = '',
        bio = ''
    } = cardData;

    const fullName = [prefix, firstName, middleName, lastName, suffix]
        .filter(Boolean)
        .join(' ')
        .trim();

    let vcard = 'BEGIN:VCARD\nVERSION:3.0\n';
    if (fullName) vcard += `FN:${fullName}\n`;
    vcard += `N:${lastName};${firstName};${middleName};${prefix};${suffix}\n`;
    if (company) vcard += `ORG:${company}\n`;
    if (title) vcard += `TITLE:${title}\n`;
    if (phone) vcard += `TEL;TYPE=CELL:${phone}\n`;
    if (email) vcard += `EMAIL;TYPE=WORK:${email}\n`;
    if (website) vcard += `URL:${website}\n`;
    if (bio) vcard += `NOTE:${bio}\n`;
    vcard += 'END:VCARD';
    return vcard;
}

module.exports = { buildVCardString };