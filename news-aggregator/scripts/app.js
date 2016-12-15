/**
 *
 * Copyright 2015 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
APP.Main = (function () {

    var LAZY_LOAD_THRESHOLD = 300;
    var $ = document.querySelector.bind(document);

    var stories = null;
    var storyStart = 0;
    var count = 100;
    var main = $('main');
    var inDetails = false;
    var storyLoadCount = 0;
    var localeData = {
        data: {
            intl: {
                locales: 'en-US'
            }
        }
    };

    var tmplStory = $('#tmpl-story').textContent;
    var tmplStoryDetails = $('#tmpl-story-details').textContent;
    var tmplStoryDetailsComment = $('#tmpl-story-details-comment').textContent;

    if (typeof HandlebarsIntl !== 'undefined') {
        HandlebarsIntl.registerWith(Handlebars);
    } else {

        // Remove references to formatRelative, because Intl isn't supported.
        var intlRelative = /, {{ formatRelative time }}/;
        tmplStory = tmplStory.replace(intlRelative, '');
        tmplStoryDetails = tmplStoryDetails.replace(intlRelative, '');
        tmplStoryDetailsComment = tmplStoryDetailsComment.replace(intlRelative, '');
    }

    var storyTemplate =
        Handlebars.compile(tmplStory);
    var storyDetailsTemplate =
        Handlebars.compile(tmplStoryDetails);
    var storyDetailsCommentTemplate =
        Handlebars.compile(tmplStoryDetailsComment);

    /**
     * As every single story arrives in shove its
     * content in at that exact moment. Feels like something
     * that should really be handled more delicately, and
     * probably in a requestAnimationFrame callback.
     */
    function onStoryData(key, details) {
        var story = document.querySelectorAll('.story[id="s-' + key + '"]')[0];
        if (!story) {
            return;
        }
        details.time *= 1000;
        story.innerHTML = storyTemplate(details);
        story.addEventListener('click', onStoryClick.bind(this, details));

        // Tick down. When zero we can batch in the next load.
        storyLoadCount--;
    }

    var storyDetails;

    function onStoryClick(details) {
        var commentsElement;
        var storyHeader;
        var storyContent;

        var storyDetailsHtml = storyDetailsTemplate(details);
        var activeStoryDetails = $('#sd-' + details.id);

        if (!activeStoryDetails && !storyDetails) {
            activeStoryDetails = document.createElement('section');
            activeStoryDetails.classList.add('story-details');
            storyDetails = activeStoryDetails;
            document.body.appendChild(activeStoryDetails);
        }

        storyDetails.setAttribute('id', 'sd-' + details.id);
        storyDetails.innerHTML = storyDetailsHtml;

        if (details.url) {
            details.urlobj = new URL(details.url);
        }

        commentsElement = storyDetails.querySelector('.js-comments');
        storyHeader = storyDetails.querySelector('.js-header');
        storyContent = storyDetails.querySelector('.js-content');

        var closeButton = storyDetails.querySelector('.js-close');
        closeButton.addEventListener('click', toggleHistory.bind(this, details.id));

        var headerHeight = storyHeader.getBoundingClientRect().height;
        storyContent.style.paddingTop = headerHeight + 'px';

        renderComments(details.kids, commentsElement);
        toggleHistory(details.id);
    }

    function renderComments(kids, commentsElement) {
        if (!kids) {
            return;
        }

        var comment;
        var commentHtml = storyDetailsCommentTemplate({
            by: '', text: 'Loading comment...'
        });
        for (var k = 0; k < kids.length; k++) {
            comment = document.createElement('aside');
            comment.setAttribute('id', 'sdc-' + kids[k]);
            comment.classList.add('story-details__comment');
            comment.innerHTML = commentHtml;
            commentsElement.appendChild(comment);

            // Update the comment with the live data.
            (function (kids, k) {
                requestAnimationFrame(function () {
                    APP.Data.getStoryComment(kids[k], function (commentDetails) {
                        commentDetails.time *= 1000;
                        var comment = commentsElement.querySelector(
                            '#sdc-' + commentDetails.id);
                        comment.innerHTML = storyDetailsCommentTemplate(
                            commentDetails,
                            localeData);
                    });
                });
            })(kids, k);
        }
    }

    function toggleHistory(id) {
        var storyDetails = $('#sd-' + id);
        storyDetails.classList.toggle('show', !inDetails);
        inDetails = !inDetails;
    }

    function loadStoryBatch() {
        if (storyLoadCount > 0) {
            return;
        }
        storyLoadCount = count;
        var end = storyStart + count;
        for (var i = storyStart; (i < end) && (i < stories.length); i++) {
            var key = String(stories[i]);
            var story = document.createElement('div');
            story.setAttribute('id', 's-' + key);
            story.classList.add('story');
            story.innerHTML = storyTemplate({
                title: '...',
                score: '-',
                by: '...',
                time: 0
            });
            main.appendChild(story);

            APP.Data.getStoryById(stories[i], onStoryData.bind(this, key));
        }
        storyStart += count;
    }

    // Bootstrap in the stories.
    APP.Data.getTopStories(function (data) {
        stories = data;
        loadStoryBatch();
        main.classList.remove('loading');
    });

    var header = $('header');
    var headerTitles = header.querySelector('.header__title-wrapper');

    main.addEventListener('scroll', function (evt) {
        var scrollHeight = evt.target.scrollHeight;
        var offsetHeight = evt.target.offsetHeight;
        var scrollTop = evt.target.scrollTop;

        var scrollTopCapped = Math.min(70, scrollTop);
        var scaleString = 'scale(' + (1 - (scrollTopCapped / 300)) + ')';

        header.style.height = (156 - scrollTopCapped) + 'px';
        headerTitles.style.transform = scaleString;

        // // Add a shadow to the header.
        header.classList.toggle('raised', scrollTop > 70);
        // Check if we need to load the next batch of stories.
        var loadThreshold = (scrollHeight - offsetHeight - LAZY_LOAD_THRESHOLD);

        if (scrollTop > loadThreshold) {
            requestAnimationFrame(loadStoryBatch);
        }
    });

})();
