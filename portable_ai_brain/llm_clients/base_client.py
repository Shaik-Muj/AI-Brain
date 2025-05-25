from abc import ABC, abstractmethod

class BaseLLMClient(ABC):
    @abstractmethod
    def call(self, prompt: str) -> str:
        pass