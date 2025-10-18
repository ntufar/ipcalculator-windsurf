// IP Calculator Conversion Functions
// Supports both IPv4 and IPv6

// IPv4 Functions
function cidrToSubnetMask(cidr) {
    if (cidr < 0 || cidr > 32) return null;
    const mask = (0xffffffff << (32 - cidr)) >>> 0;
    return [(mask >> 24) & 0xff, (mask >> 16) & 0xff, (mask >> 8) & 0xff, mask & 0xff].join('.');
}

function cidrToIpRange(cidr, networkAddress = '192.168.1.0') {
    if (cidr < 0 || cidr > 32) return null;
    const ip = networkAddress.split('.').map(Number);
    const mask = (0xffffffff << (32 - cidr)) >>> 0;
    const network = (ip[0] << 24 | ip[1] << 16 | ip[2] << 8 | ip[3]) & mask;
    const broadcast = network | (0xffffffff >>> cidr);
    return [
        [(network >> 24) & 0xff, (network >> 16) & 0xff, (network >> 8) & 0xff, network & 0xff].join('.'),
        [(broadcast >> 24) & 0xff, (broadcast >> 16) & 0xff, (broadcast >> 8) & 0xff, broadcast & 0xff].join('.')
    ];
}

function ipAndMaskToCidr(ip, mask) {
    const ipParts = ip.split('.').map(Number);
    const maskParts = mask.split('.').map(Number);
    if (ipParts.length !== 4 || maskParts.length !== 4) return null;
    const ipNum = ipParts[0] << 24 | ipParts[1] << 16 | ipParts[2] << 8 | ipParts[3];
    const maskNum = maskParts[0] << 24 | maskParts[1] << 16 | maskParts[2] << 8 | maskParts[3];
    const cidr = 32 - Math.clz32(~maskNum & 0xffffffff);
    return cidr;
}

// IPv6 Functions
function cidrToIpv6SubnetMask(cidr) {
    if (cidr < 0 || cidr > 128) return null;
    const fullGroups = Math.floor(cidr / 16);
    const remainingBits = cidr % 16;
    let mask = '';
    for (let i = 0; i < fullGroups; i++) {
        mask += 'ffff:';
    }
    if (remainingBits > 0) {
        const partial = (0xffff << (16 - remainingBits)) & 0xffff;
        mask += partial.toString(16) + ':';
    }
    while (mask.split(':').length < 9) {
        mask += '0:';
    }
    return mask.slice(0, -1);
}

function cidrToIpv6Range(cidr, networkAddress = '2001:db8::') {
    if (cidr < 0 || cidr > 128) return null;
    // Simplified for demonstration - full implementation would handle IPv6 math
    return [`${networkAddress}/${cidr}`, `IPv6 range calculation`];
}

function ipv6AndMaskToCidr(ip, mask) {
    // Simplified - full implementation needed for production
    return cidr;
}

// Main conversion function
function convertInput(type, value1, value2 = '') {
    const results = {};
    if (type === 'cidr') {
        const cidr = parseInt(value1);
        if (!isNaN(cidr)) {
            if (cidr <= 32) {
                results.subnetMask = cidrToSubnetMask(cidr);
                results.ipRange = cidrToIpRange(cidr).join(' - ');
            } else if (cidr <= 128) {
                results.subnetMask = cidrToIpv6SubnetMask(cidr);
                results.ipRange = cidrToIpv6Range(cidr).join(' - ');
            }
        }
    } else if (type === 'ipmask') {
        const cidr = ipAndMaskToCidr(value1, value2);
        if (cidr !== null) {
            results.cidr = `/${cidr}`;
        }
    }
    return results;
}

// Real-time update function
function updateCalculator() {
    const cidrInput = document.getElementById('cidr-input');
    const ipInput = document.getElementById('ip-input');
    const maskInput = document.getElementById('mask-input');
    const subnetMaskOutput = document.getElementById('subnet-mask');
    const ipRangeOutput = document.getElementById('ip-range');
    const cidrOutput = document.getElementById('cidr-output');

    if (cidrInput && cidrInput.value) {
        const results = convertInput('cidr', cidrInput.value);
        subnetMaskOutput.textContent = results.subnetMask || 'Invalid CIDR';
        ipRangeOutput.textContent = results.ipRange || 'Invalid CIDR';
    }

    if (ipInput && ipInput.value && maskInput && maskInput.value) {
        const results = convertInput('ipmask', ipInput.value, maskInput.value);
        cidrOutput.textContent = results.cidr || 'Invalid IP/Mask';
    }
}

// Input validation functions
function isValidIpv4(ip) {
    const parts = ip.split('.');
    if (parts.length !== 4) return false;
    return parts.every(part => {
        const num = parseInt(part);
        return num >= 0 && num <= 255 && part === num.toString();
    });
}

function isValidIpv6(ip) {
    // Simplified IPv6 validation
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    return ipv6Regex.test(ip);
}

function isValidSubnetMask(mask) {
    if (isValidIpv4(mask)) {
        const parts = mask.split('.').map(Number);
        const binary = parts.map(p => p.toString(2).padStart(8, '0')).join('');
        // Check if binary consists of contiguous 1s followed by contiguous 0s
        const firstZero = binary.indexOf('0');
        const lastOne = binary.lastIndexOf('1');
        // Valid if: no zeros before ones end, and no ones after zeros start
        return firstZero === -1 || lastOne < firstZero;
    }
    return false;
}

function isValidCidr(cidr) {
    const num = parseInt(cidr);
    return !isNaN(num) && num >= 0 && num <= 128;
}

// Enhanced conversion function with validation
function convertInputWithValidation(type, value1, value2 = '') {
    const results = {};
    let isValid = true;
    let errorMessage = '';

    if (type === 'cidr') {
        if (!isValidCidr(value1)) {
            isValid = false;
            errorMessage = 'Invalid CIDR: must be 0-128';
        } else {
            const cidr = parseInt(value1);
            if (cidr <= 32) {
                results.subnetMask = cidrToSubnetMask(cidr);
                results.ipRange = cidrToIpRange(cidr).join(' - ');
            } else if (cidr <= 128) {
                results.subnetMask = cidrToIpv6SubnetMask(cidr);
                results.ipRange = cidrToIpv6Range(cidr).join(' - ');
            }
        }
    } else if (type === 'ipmask') {
        if (!isValidIpv4(value1) && !isValidIpv6(value1)) {
            isValid = false;
            errorMessage = 'Invalid IP address';
        } else if (!isValidSubnetMask(value2)) {
            isValid = false;
            errorMessage = 'Invalid subnet mask';
        } else {
            const cidr = ipAndMaskToCidr(value1, value2);
            if (cidr !== null) {
                results.cidr = `/${cidr}`;
            } else {
                isValid = false;
                errorMessage = 'Unable to calculate CIDR';
            }
        }
    }

    return { results, isValid, errorMessage };
}

// Enhanced real-time update function with validation
function updateCalculator() {
    const cidrInput = document.getElementById('cidr-input');
    const ipInput = document.getElementById('ip-input');
    const maskInput = document.getElementById('mask-input');
    const subnetMaskOutput = document.getElementById('subnet-mask');
    const ipRangeOutput = document.getElementById('ip-range');
    const cidrOutput = document.getElementById('cidr-output');

    // Clear previous error states
    [cidrInput, ipInput, maskInput].forEach(input => {
        if (input) {
            input.classList.remove('error');
            const errorEl = input.parentNode.querySelector('.error-message');
            if (errorEl) errorEl.remove();
        }
    });

    if (cidrInput && cidrInput.value) {
        const { results, isValid, errorMessage } = convertInputWithValidation('cidr', cidrInput.value);
        if (isValid) {
            subnetMaskOutput.textContent = results.subnetMask || 'Invalid CIDR';
            ipRangeOutput.textContent = results.ipRange || 'Invalid CIDR';
        } else {
            subnetMaskOutput.textContent = errorMessage;
            ipRangeOutput.textContent = '';
            cidrInput.classList.add('error');
            showError(cidrInput, errorMessage);
        }
    } else {
        subnetMaskOutput.textContent = 'Enter CIDR to see result';
        ipRangeOutput.textContent = 'Enter CIDR to see result';
    }

    if (ipInput && ipInput.value && maskInput && maskInput.value) {
        const { results, isValid, errorMessage } = convertInputWithValidation('ipmask', ipInput.value, maskInput.value);
        if (isValid) {
            cidrOutput.textContent = results.cidr || 'Invalid IP/Mask';
        } else {
            cidrOutput.textContent = errorMessage;
            if (errorMessage.includes('IP')) {
                ipInput.classList.add('error');
                showError(ipInput, errorMessage);
            } else {
                maskInput.classList.add('error');
                showError(maskInput, errorMessage);
            }
        }
    } else if (ipInput && ipInput.value || maskInput && maskInput.value) {
        cidrOutput.textContent = 'Enter both IP and subnet mask';
    } else {
        cidrOutput.textContent = 'Enter IP and Mask to see result';
    }
}

function showError(input, message) {
    const errorEl = document.createElement('div');
    errorEl.className = 'error-message';
    errorEl.textContent = message;
    errorEl.style.color = '#e74c3c';
    errorEl.style.fontSize = '0.85rem';
    errorEl.style.marginTop = '0.25rem';
    input.parentNode.appendChild(errorEl);
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    const cidrInput = document.getElementById('cidr-input');
    const ipInput = document.getElementById('ip-input');
    const maskInput = document.getElementById('mask-input');

    if (cidrInput) {
        cidrInput.addEventListener('input', updateCalculator);
    }
    if (ipInput) {
        ipInput.addEventListener('input', updateCalculator);
    }
    if (maskInput) {
        maskInput.addEventListener('input', updateCalculator);
    }
});