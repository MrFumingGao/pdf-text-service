/**
 * PDF - Processor
 *
 */
var pdfFile = null;
var speechTranscript = '';
var recognizer = null;
var state = 0;


/**
 * Inactivate Tabs
 * 
 */
function inactivateTabs() {
    var iTab, tabcontent, tabbuttons, tablinks;

    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (iTab = 0; iTab < tabcontent.length; iTab++) {
        tabcontent[iTab].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (iTab = 0; iTab < tablinks.length; iTab++) {
        tablinks[iTab].className = tablinks[iTab].className.replace(" active", "");
        tablinks[iTab].style.textDecoration = "none";
    }

}

/**
 * Show the Active Tab
 * 
 * @param {*} evt the Tab to Show
 * @param {*} tab the name of the Tab
 * @param {*} button the Tab's button
 */
function showTab(evt, tab, button) {

    inactivateTabs();

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(tab).style.display = "block";
    document.getElementById(button).style.textDecoration = "underline";

    evt.currentTarget.className += " active";

}

/**
 * Render the PDF Page
 * @param {*} pdf the PDF document
 * @param {integer} numPages the number of Pages
 * @param {integer} iPage the Page Number (Starts from '1')
 * @param {string[]} text the Document's text
 */
function renderPage(pdf, numPages, iPage, text) {

    return new Promise(function(resolve, reject) {

        pdf.getPage(iPage).then(async function(page) {
            console.log("Started  Page: " + iPage);

            window.setTimeout(() => {

                var progress = parseInt((((iPage) / (numPages + 1)) * 100), 10);
                document.getElementById("uploadProgress").className = "c100 p" +

                    progress + " big green";
                $('#percentage').html(progress + "%");

            }, 10);

            var scale = 1.0;
            var viewport = page.getViewport({ scale: 1.0 });
            var canvas = document.createElement('canvas');
            var context = canvas.getContext('2d');

            canvas.height = viewport.height;
            canvas.width = viewport.width;

            console.log(viewport);

            var renderContext = {
                canvasContext: context,
                viewport: viewport
            };

            var renderTask = page.render(renderContext);

            renderTask.promise.then(function() {
                console.log(canvas);

                var yTranform = 0;

                page.getTextContent().then(function(textContent) {

                    textContent.items.forEach(function(textItem) {

                        if (yTranform == textItem.transform[textItem.transform.length - 1] && text.length > 0) {
                            text[text.length - 1] = text[text.length - 1] + ' ' + textItem.str;
                        } else {
                            text.push(textItem.str);
                        }

                        yTranform = textItem.transform[textItem.transform.length - 1];

                    });

                    resolve(canvas);

                });

            });

        });

    });

}

function processPages(pdf, numPages, iPage, text) {

    console.log("Rendering Page: " + iPage);

    renderPage(pdf, numPages, iPage, text).then(function(canvas) {
        console.log("Promised Canvas: " + iPage);

        console.log("Canvas: " + canvas);

        $('#structure')[0].appendChild(canvas);

        if (iPage < numPages) {
            processPages(pdf, numPages, iPage + 1, text);
        } else {
            var html = "";

            for (var iText = 0; iText < text.length; iText++) {
                html += text[iText] + "\r\n";
            }

            $('#text').text(html);

            var tablinks = document.getElementsByClassName("tablinks");
            for (iTab = 0; iTab < tablinks.length; iTab++) {
                tablinks[iTab].className = tablinks[iTab].className.replace(" active", "");
                tablinks[iTab].style.textDecoration = "none";
            }

            window.setTimeout(() => {

                inactivateTabs();

                $('#rendering').css('display', 'inline-block');
                $('#structureFrame').css('display', 'inline-block');
                $('#uploadWait').css('display', 'none');
                $('#tab1').css('text-decoration', 'underline');
                $('#tab1').addClass('active');

                $('#waitImage').css('display', 'none');

                console.log('completed conversion');
            }, 200);

        }

    });

}

function convert(content) {

    console.log('started conversion');

    $('#waitImage').css('display', 'block');

    var self = this;
    var complete = 0;

    var structure = $('#structure')[0];

    while (structure.firstChild) {
        structure.removeChild(structure.firstChild);
    }

    return new Promise((accept, reject) => {

        console.log("Before get document");

        var loadingTask = pdfjsLib.getDocument({ data: content });

        loadingTask.promise.then(function(pdf) {
            var numPages = pdf.numPages;
            var text = [];
            var iPage = 1;

            processPages(pdf, numPages, 1, text);

        })

    });

}

$('#copyBtn').on('click', function(e) {
    $("#text").select();
    document.execCommand('copy');

    return false;

});

$('#saveBtn').on('click', function(e) {
    var saveLink = document.createElementNS("http://www.w3.org/1999/xhtml", "a");
    var canUseSaveLink = "download" in saveLink;
    var getURL = function() {
        return view.URL || view.webkitURL || view;
    }

    var click = function(node) {
        var event = new MouseEvent("click");
        node.dispatchEvent(event);
    }

    var properties = { type: 'text/plain' };
    var fileName = 'pdf.txt';

    file = new Blob([$('#text').val()], { type: "text/plain" });

    var fileURL = URL.createObjectURL(file);

    saveLink.href = fileURL;
    saveLink.download = fileName;

    click(saveLink);

});

$(document).ready(function() {
    var header = $('#caption').html();
    var dropzone = $('#droparea');

    dropzone.on('dragover', function() {
        //add hover class when drag over
            
        dropzone.addClass('hover');    
        return false;
    }); 
    dropzone.on('dragleave', function() {     //remove hover class when drag out
            
        dropzone.removeClass('hover');    
        return false;
    }); 
    dropzone.on('drop', function(e) {     //prevent browser from open the file when drop off
            
        e.stopPropagation();    
        e.preventDefault();    
        dropzone.removeClass('hover');      //retrieve uploaded files data
            
        var files = e.originalEvent.dataTransfer.files;    
        processFiles(files);     
        return false;
    });

    var uploadBtn = $('#uploadbtn');
    var defaultUploadBtn = $('#upload'); 
    uploadBtn.on('click', function(e) {    
        e.stopPropagation();    
        e.preventDefault();    
        defaultUploadBtn.click();
    }); 
    defaultUploadBtn.on('change', function() {

         
        var files = $(this)[0].files;

            
        processFiles(files);   

            
        return false;

    });

    var processFiles = function(files) {

        if (files && typeof FileReader !== "undefined") {
            for (var iFile = 0; iFile < files.length; iFile++) {
                readFile(files[iFile]);
            }
        }

    }

    var readFile = function(file) {

        if (file.size == 0) {
            alert("File: '" + file.name + "' is empty!");
        } else if ((/pdf/i).test(file.type)) {
            $('#uploadWait').css('display', 'inline-block');
            $('#rendering').css('display', 'none');

            pdfFile = file;
            var reader = new FileReader();

            reader.onload = function(e) {
                pdfFile = file;

                $('#caption').html(header.replace(/$.*/, '&nbsp;-&nbsp;\'' + file.name + '\''));

                var progress = "100";
                document.getElementById("uploadProgress").className = "c100 p" +
                    progress +
                    " big blue";
                $('#percentage').html(progress + "%");

                convert(reader.result);

            };

            reader.onprogress = function(data) {

                if (data.lengthComputable) {
                    var progress = parseInt(((data.loaded / data.total) * 100), 10);
                    document.getElementById("uploadProgress").className = "c100 p" +
                        progress +
                        " big blue";
                    $('#percentage').html(progress + "%");

                }

            }

            reader.readAsArrayBuffer(file);

        } else {
            alert(file.type + " - is not supported");
        }

    }

});