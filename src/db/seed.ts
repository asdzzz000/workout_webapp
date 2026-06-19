import { loadEnvConfig } from '@next/env'
loadEnvConfig(process.cwd())

import { db } from './index'
import { bodyPart, workoutItem } from './schema'
import { eq } from 'drizzle-orm'

async function seed() {
  console.log('開始注入初始化資料')

  // 1. 定義部位與其對應的動作
  const data = [
    {
      part: '胸部',
      items: ['槓鈴臥推', '啞鈴臥推', '史密斯機臥推', '器械胸推', '分動式器械胸推',
        '槓鈴上斜臥推', '啞鈴上斜臥推', '史密斯機上斜臥推', '器械上斜臥推',
        '啞鈴飛鳥', '蝴蝶機夾胸', 'Cable夾胸', '雙槓臂屈伸'
      ]
    },
    {
      part: '背部',
      items: ['引體向上', '反手引體向上', '輔助引體向上', '寬握滑輪下拉', '滑輪下拉', '滑輪反手下拉',
        '窄握cable坐姿划船', '寬握cable坐姿划船', '器械坐姿划船', '分動式器械划船',
        '槓鈴划船', '啞鈴單臂划船', '硬舉']
    },
    {
      part: '腿部',
      items: ['槓鈴深蹲', '史密斯機深蹲', '啞鈴高腳杯深蹲', '壺鈴高腳杯深蹲', '哈克深蹲', 'V-Squat深蹲',
        '分腿蹲', '保加利亞分腿蹲', '坐姿腿彎舉', '坐姿腿後勾', '俯臥腿後勾', '器械腿推',
        '羅馬尼亞硬舉(啞鈴)', '羅馬尼亞硬舉(槓鈴)', '相撲硬舉(啞鈴)', '相撲硬舉(槓鈴)',
        '內收機', '外展機', '器械臀推', '槓鈴臀推']
    },
    {
      part: '肩部',
      items: ['槓鈴肩推', '啞鈴肩推', '史密斯機肩推', '器械肩推', '啞鈴側平舉', 'cable側平舉', '器械側平舉',
        '啞鈴前平舉', 'cable前平舉', '臉拉', '啞鈴反向飛鳥', 'cable反向飛鳥', '蝴蝶機反向飛鳥']
    },
    {
      part: '手臂',
      items: ['槓鈴二頭彎舉', '啞鈴二頭彎舉', '器械二頭彎舉', 'cable二頭彎舉', '啞鈴錘式彎舉', 'cable錘式彎舉',
        'cable三頭下壓', '器械三頭下壓', 'cable三頭肌伸展', '啞鈴三頭肌伸展', '頭顱粉碎者(啞鈴)', '頭顱粉碎者(W槓)']
    },
    {
      part: '核心',
      items: ['捲腹(自重)', '捲腹(滑輪)', '捲腹(器械)', '交叉捲腹', '下斜捲腹', '反向捲腹(自重)',
        '懸吊舉腿', '棒式', '側棒式', '死蟲式', '俄羅斯轉體', '登山式', '腳踏車式', 'V字捲腹']
    },
    {
      part: '有氧',
      items: ['跑步機', '橢圓機', '飛輪', '登階機']
    }
  ]

  try {
    for (const group of data) {
      // 檢查部位是否存在
      let [partRecord] = await db
        .select()
        .from(bodyPart)
        .where(eq(bodyPart.partName, group.part))
        .limit(1)

      // 如果不存在則新增
      if (!partRecord) {
        const [inserted] = await db
          .insert(bodyPart)
          .values({ partName: group.part })
          .returning()
        partRecord = inserted
        console.log('已新增部位：' + group.part)
      }

      // 注入動作
      for (const itemName of group.items) {
        // 檢查動作是否已存在（避免重複注入）
        const [existingItem] = await db
          .select()
          .from(workoutItem)
          .where(eq(workoutItem.itemName, itemName))
          .limit(1)

        if (!existingItem) {
          await db.insert(workoutItem).values({
            itemName: itemName,
            partId: partRecord.partId,
            description: `${group.part}訓練動作`
          })
          console.log('已新增動作：' + itemName)
        }
      }
    }

    console.log('初始化資料注入完成！')
  } catch (error) {
    console.error('注入過程發生錯誤：', error)
  }
}

seed()
