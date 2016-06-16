// Copyright 2015-2016 Robert Kooima
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the "Software"),
// to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense,
// and/or sell copies of the Software, and to permit persons to whom the
// Software is furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
// THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
// DEALINGS IN THE SOFTWARE.

var bit0 = '\u0020'
var bit1 = '\u00A0'

// Encode the given character string to a bit string of 8-bit values in
// 10-bit frames with a start bit of 1 and a stop bit of 0.

function tobits(data) {
	var bits = '';

	for (var i = 0; i < data.length; i++) {
		var c = data.charCodeAt(i);

		bits += bit1;
		bits += (c & 128) ? bit1 : bit0;
		bits += (c &  64) ? bit1 : bit0;
		bits += (c &  32) ? bit1 : bit0;
		bits += (c &  16) ? bit1 : bit0;
		bits += (c &   8) ? bit1 : bit0;
		bits += (c &   4) ? bit1 : bit0;
		bits += (c &   2) ? bit1 : bit0;
		bits += (c &   1) ? bit1 : bit0;
		bits += bit0;
	}
	return bits
}

// Determine whether the given bit string is synchronized beginning at bit i
// by checking for the presense of 10-bit frames with a 1 start bit and 0 stop
// bit. Confirm the presence of n good frames.

function checksync(bits, i, n) {
	for (var j = i; j < i + 10 * n; j += 10) {
		if (j + 9 < bits.length) {
			if (bits[j + 0] != bit1) return false;
			if (bits[j + 9] != bit0) return false;
		}
	}
	return true
}

// Decode the given bit string assuming an 8-bit encoding within 10-bit frames.
// Confirm the synchronization of the bit stream at each step. If lost, scan
// forward until several consecutive good frames are seen.

function frombits(bits) {
	var insync = checksync(bits, 0, 1);
	var data   = '';

	for (var i = 0; i < bits.length; ) {

		if (insync) {

			if (checksync(bits, i, 1)) {

				var c = 0;

				if (bits[i + 1] == bit1) c |= 128
				if (bits[i + 2] == bit1) c |=  64
				if (bits[i + 3] == bit1) c |=  32
				if (bits[i + 4] == bit1) c |=  16
				if (bits[i + 5] == bit1) c |=   8
				if (bits[i + 6] == bit1) c |=   4
				if (bits[i + 7] == bit1) c |=   2
				if (bits[i + 8] == bit1) c |=   1

				data += String.fromCharCode(c);

				i += 10;

			} else {
				insync = false;
			}

		} else {

			if (checksync(bits, i, 4))
				insync = true;
			else
				i += 1;
		}
	}
	return data;
}

// Decide whether character c signals the end of the indentation at the
// beginning of a line.

function istext(c) {
	return (c != '\u0020' && c != '\u00A0' && c != '\t');
}

// Decide whether character c signals the end of a line.

function iseol(c) {
	return (c == '\n');
}

// Decode and return the bit string embedded in the white space of the given
// data string. Ignore indentation whitespace.

function decode(data) {
	var intext = false;
	var bits   = '';

	for (var i = 0; i < data.length; i++) {
		if (intext) {
			if (data[i] == bit0)
				bits += bit0;
			if (data[i] == bit1)
				bits += bit1;
		}

		if (istext(data[i])) intext = true;
		if (iseol (data[i])) intext = false;
	}
	return bits;
}

// Encode the given bit string in the white space of the given text string.
// Ignore indentation whitespace.

function encode(text, bits) {
	var intext = false;
	var data   = '';
	var j      = 0;

	for (var i = 0; i < text.length; i++) {
		if (intext && j < bits.length && (text[i] == bit0 || text[i] == bit1))
			data += bits[j++];
		else
			data += text[i];

		if (istext(text[i])) intext = true;
		if (iseol (text[i])) intext = false;
	}
	return data;
}

// Strip any whitemark from the given text.

function sanitize(data) {
	return data.replace(/\u00A0/g, '\u0020');
}

// Confirm that string encoded in the stegotext matches the message text.
// This can fail if the message is too long or the plaintext is too short.

function confirm() {
	var plain   = document.getElementById("plain");
	var message = document.getElementById("message");
	var stego   = document.getElementById("stego");

	if (message.value.localeCompare(frombits(decode(stego.value))))
		stego.style.color = 'red';
	else
		stego.style.color = 'black';
}

// Trigger encoding and decoding in response to changes to the text areas.

function plainChange() {
	var plain   = document.getElementById("plain");
	var message = document.getElementById("message");
	var stego   = document.getElementById("stego");

	stego.value = encode(plain.value, tobits(message.value));

	confirm();
}

function messageChange() {
	var plain   = document.getElementById("plain");
	var message = document.getElementById("message");
	var stego   = document.getElementById("stego");

	stego.value = encode(plain.value, tobits(message.value));

	confirm();
}

function stegoChange() {
	var plain   = document.getElementById("plain");
	var message = document.getElementById("message");
	var stego   = document.getElementById("stego");

	message.value = frombits(decode(stego.value));
	plain.value   = sanitize(stego.value);

	confirm();
}

