export default ({ env }) => ({
    'users-permissions': {
        config: {
            jwtSecret: env('JWT_SECRET', 'defaultJwtSecret123-ChangeInProduction'),
        },
    },
    'jodit-editor': {
        enabled: true,
        config: {
            buttons: ['bold', 'italic', 'underline', '|', 'ul', 'ol', '|', 'font', 'fontsize', 'brush', '|', 'table', '|', 'paragraph', 'link', 'align', '|', 'undo', 'redo'],
            enter: 'P',
            defaultFontSizePoints: '14',
            controls: {
                table: {
                    exec: (editor) => {
                        editor.s.insertHTML('<table style="border-collapse:collapse;width:100%;"><tbody><tr><td style="border:1px solid #e0e0e0;padding:8px;color:#000000;">Cell 1</td><td style="border:1px solid #e0e0e0;padding:8px;color:#000000;">Cell 2</td></tr><tr><td style="border:1px solid #e0e0e0;padding:8px;color:#000000;">Cell 3</td><td style="border:1px solid #e0e0e0;padding:8px;color:#000000;">Cell 4</td></tr></tbody></table>');
                    }
                }
            },
            createAttributes: {
                table: {
                    style: 'border-collapse:collapse;width:100%;'
                },
                td: {
                    style: 'border:1px solid #e0e0e0;padding:8px;color:#000000;'
                },
                th: {
                    style: 'border:1px solid #e0e0e0;padding:8px;color:#000000;background-color:#F3F7FF;'
                }
            },
        },
    },
});
