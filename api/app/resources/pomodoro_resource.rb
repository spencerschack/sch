class PomodoroResource < JSONAPI::Resource

  include RangeResource
  include UserOwnedResource

  attributes :kind

end
