Rails.application.routes.draw do

  scope '/api' do
    resources :tasks
    resources :projects
    resources :pomodoros
    resources :login_requests, only: :create
    resources :token_requests, only: :create
  end

  get '/*path' => 'static#index'
  root to: 'static#index'

end
