import { LightningElement, api, track, wire } from 'lwc';
import { getRecord, updateRecord } from 'lightning/uiRecordApi';
import { loadScript } from 'lightning/platformResourceLoader';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import ASSETS from '@salesforce/resourceUrl/CKEditor';

export default class Ckeditor extends LightningElement {
    @api recordId;
    @api fieldName;
    @track fields = [];
    editor;
    record;

    @wire(getRecord, { recordId: '$recordId', fields: ['Id'], optionalFields: [] })
    setObjectType({error, data}) {
        if (data) {
            this.objectType = data.apiName;
            this.fields = [`${this.objectType}.${this.fieldName}`];
        }
    }

    @wire(getRecord, { recordId: '$recordId', fields: '$fields', optionalFields: [] })
    setRecord({ error, data }) {
        if (data) {
            this.record = data;

            if (this.editor) {
                this.editor.setData(this.record.fields[this.fieldName].value);
            }
        }
    }

    connectedCallback() {
        this.loadEditor();
    }

    async loadEditor() {
        //Load CKEditor
        let libPath = ASSETS + '/ckeditor.js';
        await Promise.all(
            [
                loadScript(this, libPath),
            ]
        );

        let container = this.template.querySelector(".editorContainer");
        let editor = document.createElement("div");
        editor.setAttribute("data-editor", "ClassicEditor");
        container.appendChild(editor);

        ClassicEditor.create(editor, {
                licenseKey: '',
            } )
            .then( editor => {
                this.editor = editor;
                if (this.record) {
                    this.editor.setData(this.record.fields[this.fieldName].value);
                }
            } )
            .catch( error => {
                console.error( 'Oops, something went wrong!' );
                console.error( error );
            }
        );
    }

    doSave() {
        //Prepare an updated record to send to the server
        let fields = {Id: this.recordId};
        fields[this.fieldName] = this.editor.getData();
        let updatedRecord = { fields };

        //Save record
        updateRecord(updatedRecord).then(()=>{
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Record saved successfully.',
                    variant: 'success'
                })
            );
        }).catch(error=>{
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error Saving Record',
                    message: error.body.message,
                    variant: 'error'
                })
            );
        });
    }
}