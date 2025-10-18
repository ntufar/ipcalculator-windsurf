// IP Calculator Conversion Functions
// Supports both IPv4 and IPv6

// IPv4 Functions
function cidrToSubnetMask(cidr) {
    if (cidr < 0 || cidr > 32) return null;
    const mask = (0xffffffff << (32 - cidr)) >>> 0;
    return [(mask >> 24) & 0xff, (mask >> 16) & 0xff, (mask >> 8) & 0xff, mask & 0xff].join('.');
}

function cidrToBinaryMask(cidr) {
    if (cidr < 0 || cidr > 32) return null;
    const mask = (0xffffffff << (32 - cidr)) >>> 0;
    const binary = [(mask >> 24) & 0xff, (mask >> 16) & 0xff, (mask >> 8) & 0xff, mask & 0xff]
        .map(p => p.toString(2).padStart(8, '0')).join('.');
    return binary;
}

function getNetworkClass(cidr) {
    if (cidr >= 0 && cidr <= 8) return 'A';
    if (cidr >= 9 && cidr <= 15) return 'B';
    if (cidr >= 16 && cidr <= 24) return 'C';
    if (cidr >= 25 && cidr <= 32) return 'D (Multicast)';
    return 'Unknown';
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
        const cidr = parseCidrInput(value1);
        if (cidr !== null) {
            if (cidr <= 32) {
                results.subnetMask = cidrToSubnetMask(cidr);
                results.binaryMask = cidrToBinaryMask(cidr);
                results.ipRange = cidrToIpRange(cidr).join(' - ');
                results.networkClass = getNetworkClass(cidr);
            } else if (cidr <= 128) {
                results.subnetMask = cidrToIpv6SubnetMask(cidr);
                results.ipRange = cidrToIpv6Range(cidr).join(' - ');
                results.networkClass = 'IPv6';
            }
        }
    } else if (type === 'ipmask') {
        const cidr = ipAndMaskToCidr(value1, value2);
        if (cidr !== null) {
            results.cidr = `/${cidr}`;
            if (cidr <= 32) {
                results.networkClass = getNetworkClass(cidr);
            } else {
                results.networkClass = 'IPv6';
            }
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

function parseCidrInput(input) {
    // Remove leading slash if present and parse as integer
    const cidr = parseInt(input.replace(/^\//, ''));
    return !isNaN(cidr) && cidr >= 0 && cidr <= 128 ? cidr : null;
}

function isValidCidr(cidr) {
    return parseCidrInput(cidr) !== null;
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
            const cidr = parseCidrInput(value1);
            if (cidr !== null) {
                if (cidr <= 32) {
                    results.subnetMask = cidrToSubnetMask(cidr);
                    results.binaryMask = cidrToBinaryMask(cidr);
                    results.ipRange = cidrToIpRange(cidr).join(' - ');
                    results.networkClass = getNetworkClass(cidr);
                } else if (cidr <= 128) {
                    results.subnetMask = cidrToIpv6SubnetMask(cidr);
                    results.ipRange = cidrToIpv6Range(cidr).join(' - ');
                    results.networkClass = 'IPv6';
                }
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
    const binaryMaskOutput = document.getElementById('binary-mask');
    const ipRangeOutput = document.getElementById('ip-range');
    const networkClassOutput = document.getElementById('network-class');
    const cidrOutput = document.getElementById('cidr-output');

    // Clear previous error states
    [cidrInput, ipInput, maskInput].forEach(input => {
        if (input) {
            input.classList.remove('error', 'valid');
            const errorEl = input.parentNode.querySelector('.error-message');
            if (errorEl) errorEl.remove();
        }
    });

    // Handle CIDR input
    if (cidrInput && cidrInput.value) {
        const { results, isValid, errorMessage } = convertInputWithValidation('cidr', cidrInput.value);
        if (isValid) {
            subnetMaskOutput.textContent = results.subnetMask || 'Invalid CIDR';
            binaryMaskOutput.textContent = results.binaryMask || 'Invalid CIDR';
            ipRangeOutput.textContent = results.ipRange || 'Invalid CIDR';
            networkClassOutput.textContent = results.networkClass || 'Invalid CIDR';
            updateInputStatus(cidrInput, true);
        } else {
            subnetMaskOutput.textContent = errorMessage;
            binaryMaskOutput.textContent = '';
            ipRangeOutput.textContent = '';
            networkClassOutput.textContent = '';
            updateInputStatus(cidrInput, false, true);
            showError(cidrInput, errorMessage);
        }
    } else {
        subnetMaskOutput.textContent = 'Enter CIDR to see result';
        binaryMaskOutput.textContent = 'Enter CIDR to see result';
        ipRangeOutput.textContent = 'Enter CIDR to see result';
        networkClassOutput.textContent = 'Enter CIDR to see result';
        updateInputStatus(cidrInput, false);
    }

    // Handle IP/Mask input
    if (ipInput && ipInput.value && maskInput && maskInput.value) {
        const { results, isValid, errorMessage } = convertInputWithValidation('ipmask', ipInput.value, maskInput.value);
        if (isValid) {
            cidrOutput.textContent = results.cidr || 'Invalid IP/Mask';
            if (results.networkClass) {
                networkClassOutput.textContent = results.networkClass;
            }
            updateInputStatus(ipInput, true);
            updateInputStatus(maskInput, true);
        } else {
            cidrOutput.textContent = errorMessage;
            if (errorMessage.includes('IP')) {
                updateInputStatus(ipInput, false, true);
                updateInputStatus(maskInput, false);
                showError(ipInput, errorMessage);
            } else {
                updateInputStatus(ipInput, true);
                updateInputStatus(maskInput, false, true);
                showError(maskInput, errorMessage);
            }
        }
    } else {
        if (ipInput && ipInput.value) {
            updateInputStatus(ipInput, isValidIpv4(ipInput.value) || isValidIpv6(ipInput.value));
        } else {
            updateInputStatus(ipInput, false);
        }

        if (maskInput && maskInput.value) {
            updateInputStatus(maskInput, isValidSubnetMask(maskInput.value));
        } else {
            updateInputStatus(maskInput, false);
        }

        if (ipInput && ipInput.value || maskInput && maskInput.value) {
            cidrOutput.textContent = 'Enter both IP and subnet mask';
        } else {
            cidrOutput.textContent = 'Enter IP and Mask to see result';
        }
    }
}

function showError(input, message) {
    const errorEl = document.createElement('div');
    errorEl.className = 'error-message';
    errorEl.innerHTML = getEnhancedErrorMessage(message, input);
    errorEl.style.color = '#e74c3c';
    errorEl.style.fontSize = '0.85rem';
    errorEl.style.marginTop = '0.25rem';
    input.parentNode.appendChild(errorEl);
}

function getEnhancedErrorMessage(message, input) {
    if (message.includes('CIDR')) {
        return `${message}<br><small>Suggestion: Try values like 24 (for /24) or 64 (for /64)</small>`;
    } else if (message.includes('IP')) {
        return `${message}<br><small>Suggestion: Use format like 192.168.1.1 or 2001:db8::1</small>`;
    } else if (message.includes('subnet mask')) {
        return `${message}<br><small>Suggestion: Use format like 255.255.255.0 or 255.255.0.0</small>`;
    }
    return message;
}

// Copy to clipboard functionality
function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    const text = element.textContent.trim();

    if (text && text !== 'Enter CIDR to see result' && text !== 'Enter IP and Mask to see result' && text !== 'Invalid CIDR' && text !== 'Invalid IP/Mask') {
        navigator.clipboard.writeText(text).then(() => {
            const copyBtn = element.parentNode.querySelector('.copy-btn');
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = '✅';
            copyBtn.classList.add('copied');

            setTimeout(() => {
                copyBtn.innerHTML = originalText;
                copyBtn.classList.remove('copied');
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy: ', err);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);

            const copyBtn = element.parentNode.querySelector('.copy-btn');
            copyBtn.innerHTML = '✅';
            copyBtn.classList.add('copied');

            setTimeout(() => {
                copyBtn.innerHTML = originalText;
                copyBtn.classList.remove('copied');
            }, 2000);
        });
    }
}

// Update input status indicators
function updateInputStatus(input, isValid, isError = false) {
    const inputGroup = input.closest('.input-group');
    const statusEl = inputGroup.querySelector('.input-status');

    inputGroup.classList.remove('valid', 'error');
    if (statusEl) statusEl.textContent = '';

    if (isError) {
        inputGroup.classList.add('error');
        if (statusEl) statusEl.textContent = '❌';
    } else if (isValid && input.value) {
        inputGroup.classList.add('valid');
        if (statusEl) statusEl.textContent = '✅';
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    const cidrInput = document.getElementById('cidr-input');
    const ipInput = document.getElementById('ip-input');
    const maskInput = document.getElementById('mask-input');

    if (cidrInput) {
        cidrInput.addEventListener('input', updateCalculator);
        // Trigger initial calculation if field has pre-filled value
        if (cidrInput.value) {
            updateCalculator();
        }
    }
    if (ipInput) {
        ipInput.addEventListener('input', updateCalculator);
    }
    if (maskInput) {
        maskInput.addEventListener('input', updateCalculator);
    }

    // Trigger initial calculation for IP/Mask fields if they have pre-filled values
    if (ipInput && maskInput && ipInput.value && maskInput.value) {
        updateCalculator();
    }
});