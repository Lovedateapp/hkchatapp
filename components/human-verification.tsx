"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Check, X, RefreshCw } from "lucide-react"

interface HumanVerificationProps {
  onVerified: () => void
}

export function HumanVerification({ onVerified }: HumanVerificationProps) {
  const [verificationMethod, setVerificationMethod] = useState<"math" | "image" | "slider">("math")
  const [mathProblem, setMathProblem] = useState({ num1: 0, num2: 0, operator: "+", answer: "" })
  const [mathResult, setMathResult] = useState<boolean | null>(null)
  const [sliderValue, setSliderValue] = useState(0)
  const [sliderTarget, setSliderTarget] = useState(0)
  const [sliderResult, setSliderResult] = useState<boolean | null>(null)
  const [imageOptions, setImageOptions] = useState<string[]>([])
  const [correctImageIndex, setCorrectImageIndex] = useState(0)
  const [imagePrompt, setImagePrompt] = useState("")
  const [imageResult, setImageResult] = useState<boolean | null>(null)
  const [isVerified, setIsVerified] = useState(false)

  // 生成數學問題
  const generateMathProblem = () => {
    const operators = ["+", "-", "×"]
    const operator = operators[Math.floor(Math.random() * operators.length)]
    let num1, num2

    if (operator === "+") {
      num1 = Math.floor(Math.random() * 10) + 1
      num2 = Math.floor(Math.random() * 10) + 1
    } else if (operator === "-") {
      num1 = Math.floor(Math.random() * 10) + 10
      num2 = Math.floor(Math.random() * 9) + 1
    } else {
      num1 = Math.floor(Math.random() * 5) + 1
      num2 = Math.floor(Math.random() * 5) + 1
    }

    setMathProblem({
      num1,
      num2,
      operator,
      answer: "",
    })
    setMathResult(null)
  }

  // 生成滑塊目標
  const generateSliderTarget = () => {
    setSliderTarget(Math.floor(Math.random() * 100))
    setSliderValue(0)
    setSliderResult(null)
  }

  // 生成圖像選擇題
  const generateImageChallenge = () => {
    const challenges = [
      {
        prompt: "選擇包含「貓」的圖像",
        options: ["🐱", "🐶", "🐰", "🐭"],
        correctIndex: 0,
      },
      {
        prompt: "選擇包含「蘋果」的圖像",
        options: ["🍌", "🍎", "🍇", "🍊"],
        correctIndex: 1,
      },
      {
        prompt: "選擇包含「汽車」的圖像",
        options: ["🚗", "🚲", "✈️", "🚢"],
        correctIndex: 0,
      },
      {
        prompt: "選擇包含「星星」的圖像",
        options: ["🌙", "☀️", "⭐", "🌈"],
        correctIndex: 2,
      },
      {
        prompt: "選擇包含「笑臉」的圖像",
        options: ["😀", "😢", "😡", "😴"],
        correctIndex: 0,
      },
    ]

    const challenge = challenges[Math.floor(Math.random() * challenges.length)]
    setImagePrompt(challenge.prompt)
    setImageOptions(challenge.options)
    setCorrectImageIndex(challenge.correctIndex)
    setImageResult(null)
  }

  // 初始化
  useEffect(() => {
    generateMathProblem()
    generateSliderTarget()
    generateImageChallenge()
  }, [])

  // 檢查數學問題答案
  const checkMathAnswer = () => {
    let correctAnswer
    if (mathProblem.operator === "+") {
      correctAnswer = mathProblem.num1 + mathProblem.num2
    } else if (mathProblem.operator === "-") {
      correctAnswer = mathProblem.num1 - mathProblem.num2
    } else {
      correctAnswer = mathProblem.num1 * mathProblem.num2
    }

    const isCorrect = Number.parseInt(mathProblem.answer) === correctAnswer
    setMathResult(isCorrect)

    if (isCorrect) {
      setIsVerified(true)
      onVerified()
    } else {
      generateMathProblem()
    }
  }

  // 檢查滑塊值
  const checkSliderValue = () => {
    const isCorrect = Math.abs(sliderValue - sliderTarget) <= 2
    setSliderResult(isCorrect)

    if (isCorrect) {
      setIsVerified(true)
      onVerified()
    } else {
      generateSliderTarget()
    }
  }

  // 檢查圖像選擇
  const checkImageSelection = (index: number) => {
    const isCorrect = index === correctImageIndex
    setImageResult(isCorrect)

    if (isCorrect) {
      setIsVerified(true)
      onVerified()
    } else {
      generateImageChallenge()
    }
  }

  // 切換驗證方法
  const switchVerificationMethod = () => {
    if (verificationMethod === "math") {
      setVerificationMethod("image")
    } else if (verificationMethod === "image") {
      setVerificationMethod("slider")
    } else {
      setVerificationMethod("math")
    }
  }

  if (isVerified) {
    return (
      <div className="flex items-center justify-center p-4 bg-green-50 rounded-md">
        <Check className="h-5 w-5 text-green-500 mr-2" />
        <span className="text-green-700">驗證成功</span>
      </div>
    )
  }

  return (
    <Card className="p-4 border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-medium">請完成人機驗證</h3>
        <Button variant="ghost" size="sm" onClick={switchVerificationMethod}>
          <RefreshCw className="h-4 w-4 mr-1" /> 換一個
        </Button>
      </div>

      {verificationMethod === "math" && (
        <div className="space-y-3">
          <div className="text-center">
            <p className="text-sm">請計算：</p>
            <p className="text-lg font-bold">
              {mathProblem.num1} {mathProblem.operator} {mathProblem.num2} = ?
            </p>
          </div>
          <div className="flex space-x-2">
            <Input
              type="number"
              value={mathProblem.answer}
              onChange={(e) => setMathProblem({ ...mathProblem, answer: e.target.value })}
              placeholder="輸入答案"
              className="flex-1"
            />
            <Button onClick={checkMathAnswer}>確認</Button>
          </div>
          {mathResult === false && (
            <div className="flex items-center text-red-500 text-sm">
              <X className="h-4 w-4 mr-1" /> 答案不正確，請重試
            </div>
          )}
        </div>
      )}

      {verificationMethod === "slider" && (
        <div className="space-y-3">
          <div className="text-center">
            <p className="text-sm">請將滑塊移動到 {sliderTarget} 的位置：</p>
            <div className="py-4">
              <Slider
                value={[sliderValue]}
                min={0}
                max={100}
                step={1}
                onValueChange={(value) => setSliderValue(value[0])}
              />
            </div>
            <p className="text-sm font-medium">當前值：{sliderValue}</p>
          </div>
          <Button onClick={checkSliderValue} className="w-full">
            確認
          </Button>
          {sliderResult === false && (
            <div className="flex items-center text-red-500 text-sm">
              <X className="h-4 w-4 mr-1" /> 未達到目標，請重試
            </div>
          )}
        </div>
      )}

      {verificationMethod === "image" && (
        <div className="space-y-3">
          <div className="text-center">
            <p className="text-sm">{imagePrompt}</p>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {imageOptions.map((option, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="h-16 text-2xl"
                  onClick={() => checkImageSelection(index)}
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
          {imageResult === false && (
            <div className="flex items-center text-red-500 text-sm">
              <X className="h-4 w-4 mr-1" /> 選擇錯誤，請重試
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
