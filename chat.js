(function() {
    'use strict';

    angular.module('chat', ['relativeDate'])    
    .directive('chat', ['$timeout', SimpleChat])

    .factory('socket', function() {
        var socket = io.connect('http://[socket.io connection]/'); //setup socket
        return socket;
    });
      
    function SimpleChat($timeout) {
		var chatTemplate =                                                                
			'<div ng-show="visible" class="row chat-window col-xs-5 col-md-3 {{vm.theme}}"   ng-class="{minimized: vm.isHidden}">' +
			    '<div class="col-xs-12 col-md-12"  ng-style="vm.z">' +
			        '<div class="panel">' +
			            '<div class="panel-heading chat-top-bar" ng-click="vm.toggle()"  >' +
				            '<div class="col-md-8 col-xs-8">' +
				                '<h3 class="panel-title"><span class="fa fa-comments-o fa-c"></span> {{vm.title}}</h3>' +
				            '</div>' +
				            '<div class="col-md-4 col-xs-4 window-actions" style="text-align: right;">' +
				                '<span class="fa" ng-class="vm.chatButtonClass" "></span>' +    
			                '</div>' +
			            '</div>' +
                        
    					'<div class="panel-footer chat-bottom-bar" ng-style="vm.panelStyle">' +
							'<form style="display:inherit" ng-submit="vm.submitFunction()">' +
								'<div class="input-group" >' +
									'<input type="text" class="form-control input-sm chat-input" placeholder="{{vm.inputPlaceholderText}}" ng-model="vm.writingMessage" />' +
									'<span class="input-group-btn">' +
										'<input type="submit" class="btn btn-sm chat-submit-button" value="{{vm.submitButtonText}}" />' +
									'</span>' +
								'</div>' +
							'</form>' +
						'</div>' +
                        
						'<div class="panel-body msg-container-base" ng-style="vm.panelStyle">' +
							'<div class="row msg-container" ng-repeat="message in vm.messages" ng-init="selfAuthored = vm.myUserId == message.fromUserId">' +
			                    '<div class="col-md-12 col-xs-12">' +
									'<div class="chat-msg" message-id="{{message._id}}" ng-class="{\'chat-msg-sent\': selfAuthored, \'chat-msg-recieved\': !selfAuthored}">' +
										'<span class="hide"></span>' +
										'<img ng-if="message.imageUrl" class="profile" ng-class="{\'pull-right\': selfAuthored, \'pull-left\': !selfAuthored}" ng-src="{{message.imageUrl}}" />' +
										'<p>{{message.content}}</p>' +
										'<div class="chat-msg-author">' +											
											'<span class="date">{{message.date| relativeDate }}</span>&nbsp;&middot;&nbsp;' +
                                            '<strong>{{message.username}}</strong>' + /* |date:\'HH:mm\' */
										'</div>' +
									'</div>' +
								'</div>' +
							'</div>' +
						'</div>' +

					'</div>' +
				'</div>' +
			'</div>';


        var directive = {
            restrict: 'EA',
            template: chatTemplate,
            replace: true,
            scope: {
                messages: '=',
                username: '=',
                myUserId: '=',
                inputPlaceholderText: '@',
                submitButtonText: '@',
                title: '@',
                theme: '@',
                submitFunction: '&',
                visible: '=',
                infiniteScroll: '&'
            },
            link: link,
            controller: ChatCtrl,
            controllerAs: 'vm'
        };

        function link(scope, element) {
            if (!scope.inputPlaceholderText) {
                scope.inputPlaceholderText = 'Write your message here...';

            }

            if (!scope.submitButtonText || scope.submitButtonText === '') {
                scope.submitButtonText = 'Send';
            }

            if (!scope.title) {
                scope.title = 'Chat';
            }

            scope.$msgContainer = $('.msg-container-base'); // BS angular $el jQuery lite won't work for scrolling
            scope.$chatInput = $(element).find('.chat-input');


            var elWindow = scope.$msgContainer[0];
            scope.$msgContainer.bind('scroll', _.throttle(function() {
                var scrollHeight = elWindow.scrollHeight;
                if (elWindow.scrollTop <= 10) {
                    scope.historyLoading = true; // disable jump to bottom
                    scope.$apply(scope.infiniteScroll);
                    $timeout(function() {
                        scope.historyLoading = false;
                        if (scrollHeight !== elWindow.scrollHeight) // don't scroll down if nothing new added
                            scope.$msgContainer.scrollTop(360); // scroll down for loading 4 messages
                    }, 150);
                }
            }, 300));
        }

        return directive;
    }

    ChatCtrl.$inject = ['$scope', '$timeout', 'socket', '$interval'];

    function ChatCtrl($scope, $timeout, socket, $interval) {
        var vm = this;
        socket.emit('chat');
        socket.emit('rand');


        //create a random username
        vm.username = '';
        socket.on('rand',function(d){
            vm.username = d.f.capitalizeFirstLetter();
        });
        socket.on('chat', function(d) {
            vm.messages = d;
            $scope.$digest();
        });
        socket.on('m', function(d) {            
            vm.messages.unshift(d);
            $scope.$digest();
        });        
        
        vm.myUserId =               $scope.myUserId;
        vm.inputPlaceholderText =   $scope.inputPlaceholderText;
        vm.submitButtonText =       $scope.submitButtonText;
        vm.title =                  $scope.title;
        vm.theme =                  'chat-th-' + $scope.theme;
        vm.writingMessage =         '';
        vm.chatButtonClass =        'fa-angle-double-up fa-3x icon_minim';
        vm.panelStyle =             { 'display': 'none' };
        vm.isHidden =               true;
        vm.toggle =                 toggle;
        vm.close =                  close;
        vm.submitFunction =         submitFunction;


        //emit message to server. simple checks
        function submitFunction() {

            if (vm.writingMessage && vm.writingMessage !== '' && vm.username) {
                socket.emit('m', {
                    'username':     vm.username,
                    'content':      vm.writingMessage,
                    'date':         (new Date()).getTime()
                });
            }
            vm.writingMessage = '';

        }


        //update time every second
        var rin = $interval(function() {
            for (var i = 0; i < vm.messages.length; i++)
                vm.messages[i].date--;
            $scope.$digest();
        }, 1000, 0, null);
        
        //destroy timer
        $scope.$on('$destroy', function() {
            $interval.cancel(rin);
        });
        $scope.$on('$locationChangeStart', function(event) {
            $interval.cancel(rin);
        });

        $scope.$watch('visible', function() { 
            $timeout(function() {
                $scope.$chatInput.focus();
            }, 250);
        });

        function scrollToBottom() {
            $timeout(function() { 
                $scope.$msgContainer.scrollTop($scope.$msgContainer[0].scrollHeight);
            }, 200, false);
        }

        function close() {
            $scope.visible = false;
        }

        function toggle() {
            if (vm.isHidden) {                
                vm.chatButtonClass = 'fa-angle-double-down fa-3x icon_minim';
                vm.panelStyle = { 'display': 'block' };
                vm.z = { 'z-index': 10 };
                vm.isHidden = false;                
            }
            else {
                vm.chatButtonClass = 'fa-angle-double-up fa-3x icon_minim';
                vm.panelStyle =     { 'display': 'none' };
                vm.z =              { 'z-index': 0 };
                vm.isHidden = true;
            }
        }
    }

    String.prototype.capitalizeFirstLetter = function() {
        return this.charAt(0).toUpperCase() + this.slice(1);
    };

})();

