module.exports = {
    title: 'Rjax',
    description: 'base on rxjs awesome ajax library',
    base: '/rjax/docs/dist',
    themeConfig: {
        repo: 'ppjjzz/rjax',
        nav: [
            { text: '指南', link: '/guide/' },
        ],
        sidebar: {
            '/guide/': [{
                title: '指南',
                collapsable: false,
                children: [
                    '',
                    'getting-started',
                    'advanced'
                ]
            }]
        }
    },
    
}