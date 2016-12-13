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
APP.Data = (function (state) {

    var HN_API_BASE = 'https://hacker-news.firebaseio.com';
    var HN_TOPSTORIES_URL = HN_API_BASE + '/v0/topstories.json';
    var HN_STORYDETAILS_URL = HN_API_BASE + '/v0/item/[ID].json';

    var get = state === 'async' ? fetchAPI : requestAPI;

    function getTopStories(callback) {
        get(HN_TOPSTORIES_URL, function (evt) {
            callback(evt.target.response);
        });
    }

    function getStoryById(id, callback) {
        var storyURL = HN_STORYDETAILS_URL.replace(/\[ID\]/, id);

        get(storyURL, function (evt) {
            callback(evt.target.response);
        });
    }

    function getStoryComment(id, callback) {
        var storyCommentURL = HN_STORYDETAILS_URL.replace(/\[ID\]/, id);

        get(storyCommentURL, function (evt) {
            callback(evt.target.response);
        });
    }

    function requestAPI(url, callback) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'json';
        xhr.onload = callback;
        xhr.onerror = console.error.bind(console);
        xhr.send();
        fetchAPI(url, callback);
    }

    function fetchAPI(url, callback) {
        var request = new Request(url, {
            headers: new Headers({
                'Content-Type': 'text/plain'
            })
        });

        function adapter(data) {
            return {
                target: {
                    response: data
                }
            }
        }

        return fetch(request)
            .then(function (response) {
                return response.json();
            })
            .then(adapter)
            .then(callback)
            .catch(console.error.bind(console));
    }

    return {
        getTopStories: getTopStories,
        getStoryById: getStoryById,
        getStoryComment: getStoryComment
    };

})('async');
